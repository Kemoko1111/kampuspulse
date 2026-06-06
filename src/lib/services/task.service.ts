import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Task, TaskApplication } from "@/types";
import { AppError } from "@/lib/errors/app-error";

type TaskWithApplications = Task & { applications?: TaskApplication[] };
import { TaskRepository } from "@/lib/repositories/task.repository";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { PaymentService } from "@/lib/services/payment.service";

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

    const { data: updatedTask, error: updateError } = await this.taskRepo.update(taskId, { status: newStatus });
    if (updateError) throw updateError;
    const data = updatedTask as Task;

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
