import { inngest } from "../client.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });
        if (!userObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }
        return userObject;
      });

      await step.run("send-welcome-email", async () => {
        const subject = "Welcome to Ticket Management System";
        const message = `Hi ${user.email.split('@')[0]},\n\nWelcome to our Ticket Management System!\n\nWe're excited to have you on board.\n\nBest regards,\nTicket Management Team`;
        await sendMail(user.email, subject, message);
      });

      return { success: true };
    } catch (error) {
      console.error("Error in signup workflow:", error.message);
      return { success: false };
    }
  }
);
