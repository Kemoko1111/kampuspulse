import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Task, TaskApplication } from "@/types";
import { AppError } from "@/lib/errors/app-error";

type TaskWithApplications = Task & { applications?: TaskApplication[] };
import { TaskRepository } from "@/lib/repositories/task.repository";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { PaymentService } from "@/lib/services/payment.service";
import { createAdminClient } from "@/lib/supabase/admin";

// Platform keeps 10% of a task reward; the worker receives 90% (matches the
// split shown to the poster on the post-task screen).
const PLATFORM_FEE_RATE = 0.1;

const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled", "disputed"],
  completed: [],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

export class TaskService {
  private taskRepo: TaskRepository;
  private notifRepo: NotificationRepository;
  private paymentService: PaymentService;

  constructor(private supabase: TypedSupabaseClient) {
    this.taskRepo = new TaskRepository(supabase);
    this.notifRepo = new NotificationRepository(supabase);
    this.paymentService = new PaymentService(supabase);
  }

  async apply(taskId: string, applicantId: string, coverMessage?: string, proposedPrice?: number) {
    const { data: rawTask, error } = await this.taskRepo.findById(taskId);
    const task = rawTask as TaskWithApplications | null;
    if (error || !task) throw new AppError("Task not found", 404);
    if (task.status !== "open") throw new AppError("Task is not open", 400);
    if (task.poster_id === applicantId) throw new AppError("Cannot apply to own task", 400);

    const { data, error: applyError } = await this.taskRepo.createApplication({
      task_id: taskId,
      applicant_id: applicantId,
      cover_message: coverMessage,
      proposed_price: proposedPrice,
    });

    if (applyError) throw applyError;

    const application = data as { id: string };
    await this.notifRepo.create({
      user_id: task.poster_id,
      type: "task_application",
      title: "New Task Application",
      body: `Someone applied for your task: ${task.title}`,
      data: { task_id: taskId, application_id: application.id },
    });

    return data;
  }

  async acceptApplication(taskId: string, posterId: string, applicationId: string) {
    const { data: rawTask, error } = await this.taskRepo.findById(taskId);
    const task = rawTask as TaskWithApplications | null;
    if (error || !task) throw new AppError("Task not found", 404);
    if (task.poster_id !== posterId) throw new AppError("Forbidden", 403);
    if (task.status !== "open") throw new AppError("Task is not open", 400);

    // Escrow must be funded before a worker can be assigned — this is what
    // protects the worker from doing the job unpaid.
    if (task.payment_status !== "escrowed") {
      throw new AppError("Fund the task escrow before accepting a worker", 400, "ESCROW_REQUIRED");
    }

    const application = task.applications?.find((a: { id: string }) => a.id === applicationId);
    if (!application) throw new AppError("Application not found", 404);

    await this.taskRepo.updateApplication(applicationId, { status: "accepted" });
    await this.taskRepo.rejectOtherApplications(taskId, applicationId);
    await this.taskRepo.update(taskId, {
      status: "assigned",
      assignee_id: application.applicant_id,
    });

    await this.notifRepo.create({
      user_id: application.applicant_id,
      type: "task_accepted",
      title: "Task Accepted!",
      body: `Your application for "${task.title}" was accepted.`,
      data: { task_id: taskId },
    });

    return { success: true };
  }

  async rejectApplication(taskId: string, posterId: string, applicationId: string) {
    const { data: rawTask, error } = await this.taskRepo.findById(taskId);
    const task = rawTask as TaskWithApplications | null;
    if (error || !task) throw new AppError("Task not found", 404);
    if (task.poster_id !== posterId) throw new AppError("Forbidden", 403);

    const application = task.applications?.find((a: { id: string }) => a.id === applicationId);
    if (!application) throw new AppError("Application not found", 404);

    await this.taskRepo.updateApplication(applicationId, { status: "rejected" });

    await this.notifRepo.create({
      user_id: application.applicant_id,
      type: "task_rejected",
      title: "Application Not Selected",
      body: `Your application for "${task.title}" was not selected.`,
      data: { task_id: taskId },
    });

    return { success: true };
  }

  async updateStatus(taskId: string, profileId: string, newStatus: string) {
    const { data: rawTask, error } = await this.taskRepo.findById(taskId);
    const task = rawTask as TaskWithApplications | null;
    if (error || !task) throw new AppError("Task not found", 404);

    const isPoster = task.poster_id === profileId;
    const isAssignee = task.assignee_id === profileId;
    if (!isPoster && !isAssignee) throw new AppError("Forbidden", 403);

    const allowed = VALID_TRANSITIONS[task.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(`Cannot transition from ${task.status} to ${newStatus}`, 400);
    }

    // Completing a task releases the escrow to the worker, so only the poster
    // may confirm completion — otherwise a worker could pay themselves out.
    if (newStatus === "completed" && !isPoster) {
      throw new AppError("Only the poster can confirm completion and release payment", 403);
    }

    const { data: updatedTask, error: updateError } = await this.taskRepo.update(taskId, { status: newStatus });
    if (updateError) throw updateError;
    const data = updatedTask as Task;

    // Money movement — uses the service-role client because it credits another
    // user's wallet / writes their transaction rows (RLS scopes those to the
    // owner).
    if (newStatus === "completed" && task.assignee_id && task.payment_status === "escrowed") {
      await this.releaseEscrow(task);
    } else if (newStatus === "cancelled" && task.payment_status === "escrowed") {
      await this.refundEscrow(task);
    }

    const notifyId = isPoster ? task.assignee_id : task.poster_id;
    if (notifyId) {
      await this.notifRepo.create({
        user_id: notifyId,
        type: "task_update",
        title: "Task Status Updated",
        body: `Task "${task.title}" is now ${newStatus.replace("_", " ")}.`,
        data: { task_id: taskId, status: newStatus },
      });
    }

    return data;
  }

  private async releaseEscrow(task: TaskWithApplications) {
    const admin = createAdminClient();
    const workerAmount = Math.round(task.reward * (1 - PLATFORM_FEE_RATE) * 100) / 100;

    await admin.rpc("increment_wallet_balance", {
      p_user_id: task.assignee_id!,
      p_amount: workerAmount,
    } as never);

    await admin.from("transactions").insert({
      user_id: task.assignee_id!,
      type: "payout",
      amount: workerAmount,
      payment_method: "wallet",
      reference: `TASK_PAYOUT_${task.id}_${Date.now()}`,
      status: "success",
      description: `Payment for task: ${task.title}`,
      metadata: { task_id: task.id, gross: task.reward, platform_fee_rate: PLATFORM_FEE_RATE },
    } as never);

    await admin.from("tasks").update({ payment_status: "released" } as never).eq("id", task.id);

    await this.notifRepo.create({
      user_id: task.assignee_id!,
      type: "task_paid",
      title: "You've been paid!",
      body: `GHS ${workerAmount.toFixed(2)} for "${task.title}" was added to your wallet.`,
      data: { task_id: task.id },
    });
  }

  private async refundEscrow(task: TaskWithApplications) {
    const admin = createAdminClient();

    await admin.rpc("increment_wallet_balance", {
      p_user_id: task.poster_id,
      p_amount: task.reward,
    } as never);

    await admin.from("transactions").insert({
      user_id: task.poster_id,
      type: "refund",
      amount: task.reward,
      payment_method: "wallet",
      reference: `TASK_REFUND_${task.id}_${Date.now()}`,
      status: "success",
      description: `Escrow refund for cancelled task: ${task.title}`,
      metadata: { task_id: task.id },
    } as never);

    await admin.from("tasks").update({ payment_status: "refunded" } as never).eq("id", task.id);
  }

  async initiateEscrowPayment(taskId: string, posterId: string, email: string) {
    const { data: rawTask, error } = await this.taskRepo.findById(taskId);
    const task = rawTask as TaskWithApplications | null;
    if (error || !task) throw new AppError("Task not found", 404);
    if (task.poster_id !== posterId) throw new AppError("Forbidden", 403);

    const payment = await this.paymentService.initializePayment({
      amount: task.reward,
      email,
      profileId: posterId,
      taskId,
      paymentMethod: "mtn_momo",
    });

    await this.taskRepo.update(taskId, { payment_reference: payment.reference, payment_status: "pending" });

    return payment;
  }
}
