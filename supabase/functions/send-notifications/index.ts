// ============================================
// SEND NOTIFICATIONS EDGE FUNCTION
// Sends email notifications using Resend
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY);

interface NotificationRequest {
  type: "attendance" | "result" | "message" | "fee-payment" | "general";
  recipient: {
    email: string;
    name: string;
  };
  sender?: {
    name: string;
    role: string;
  };
  data: {
    studentName?: string;
    studentClass?: string;
    teacherName?: string;
    subject?: string;
    reason?: string; // For attendance
    date?: string;
    score?: number;
    totalScore?: number;
    term?: string;
    amount?: number;
    dueDate?: string;
    message?: string;
    link?: string;
  };
  schoolName: string;
  schoolEmail: string;
}

function getEmailTemplate(
  request: NotificationRequest
): { subject: string; html: string } {
  const { type, recipient, data, schoolName, sender } = request;

  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #009688 0%, #00796b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
      .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; padding: 10px 20px; background: #009688; color: white; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 15px 0; }
      .success { background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 4px; margin: 15px 0; }
      .info-row { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #009688; }
      .info-label { font-weight: bold; color: #009688; }
    </style>
  `;

  if (type === "attendance") {
    return {
      subject: `${schoolName}: Attendance Alert for ${data.studentName}`,
      html: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📋 Attendance Notification</h1>
          </div>
          <div class="content">
            <p>Dear ${recipient.name},</p>
            <p>This is to inform you that <strong>${data.studentName}</strong> was <strong style="color: #d9534f;">absent</strong> on <strong>${data.date}</strong>.</p>
            
            <div class="info-row">
              <span class="info-label">Student:</span> ${data.studentName}
            </div>
            <div class="info-row">
              <span class="info-label">Class:</span> ${data.studentClass}
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span> ${data.date}
            </div>
            <div class="info-row">
              <span class="info-label">Reason:</span> ${data.reason || "Not specified"}
            </div>

            <p>Please contact the school if you have any questions regarding your child's attendance.</p>
            
            <a href="${data.link || "https://edugemini.app"}" class="button">View Attendance</a>
          </div>
          <div class="footer">
            <p>${schoolName}</p>
            <p style="margin-top: 10px; color: #999;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };
  }

  if (type === "result") {
    return {
      subject: `${schoolName}: Results Published for ${data.studentName}`,
      html: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📊 Result Notification</h1>
          </div>
          <div class="content">
            <p>Dear ${recipient.name},</p>
            <p>The results for <strong>${data.studentName}</strong> in <strong>${data.subject}</strong> have been published.</p>
            
            <div class="success">
              <strong>Score: ${data.score}/${data.totalScore}</strong><br>
              <strong>Term:</strong> ${data.term}
            </div>

            <div class="info-row">
              <span class="info-label">Student:</span> ${data.studentName}
            </div>
            <div class="info-row">
              <span class="info-label">Subject:</span> ${data.subject}
            </div>
            <div class="info-row">
              <span class="info-label">Score:</span> ${data.score}/${data.totalScore}
            </div>
            <div class="info-row">
              <span class="info-label">Term:</span> ${data.term}
            </div>

            <p>Log in to your parent portal to view detailed results and recommendations.</p>
            
            <a href="${data.link || "https://edugemini.app"}" class="button">View Results</a>
          </div>
          <div class="footer">
            <p>${schoolName}</p>
            <p style="margin-top: 10px; color: #999;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };
  }

  if (type === "message") {
    return {
      subject: `${schoolName}: New Message from ${sender?.name}`,
      html: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Dear ${recipient.name},</p>
            <p><strong>${sender?.name}</strong> (${sender?.role}) sent you a message:</p>
            
            <div class="info-row">
              <strong>${data.subject || "Message"}</strong><br>
              ${data.message || ""}
            </div>

            <p>Log in to your portal to view the full message and reply.</p>
            
            <a href="${data.link || "https://edugemini.app"}" class="button">View Message</a>
          </div>
          <div class="footer">
            <p>${schoolName}</p>
            <p style="margin-top: 10px; color: #999;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };
  }

  if (type === "fee-payment") {
    return {
      subject: `${schoolName}: Fee Payment Due`,
      html: `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💰 Fee Payment Notification</h1>
          </div>
          <div class="content">
            <p>Dear ${recipient.name},</p>
            <p>A fee payment is due for <strong>${data.studentName}</strong>.</p>
            
            <div class="alert">
              <strong>Amount Due: ₦${(data.amount || 0).toLocaleString()}</strong><br>
              <strong>Due Date: ${data.dueDate}</strong>
            </div>

            <div class="info-row">
              <span class="info-label">Student:</span> ${data.studentName}
            </div>
            <div class="info-row">
              <span class="info-label">Amount:</span> ₦${(data.amount || 0).toLocaleString()}
            </div>
            <div class="info-row">
              <span class="info-label">Due Date:</span> ${data.dueDate}
            </div>

            <p>Please log in to your parent portal to make the payment online.</p>
            
            <a href="${data.link || "https://edugemini.app"}" class="button">Pay Now</a>
          </div>
          <div class="footer">
            <p>${schoolName}</p>
            <p style="margin-top: 10px; color: #999;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };
  }

  // Default general notification
  return {
    subject: `${schoolName}: ${data.subject || "Notification"}`,
    html: `
      ${baseStyles}
      <div class="container">
        <div class="header">
          <h1>🔔 Notification</h1>
        </div>
        <div class="content">
          <p>Dear ${recipient.name},</p>
          <p>${data.message || "You have a new notification."}</p>
          
          ${data.link ? `<a href="${data.link}" class="button">View Details</a>` : ""}
        </div>
        <div class="footer">
          <p>${schoolName}</p>
          <p style="margin-top: 10px; color: #999;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  };
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const requestBody: NotificationRequest = await req.json();

    // Validate required fields
    if (
      !requestBody.recipient?.email ||
      !requestBody.type ||
      !requestBody.schoolName
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: recipient.email, type, schoolName",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get email template
    const { subject, html } = getEmailTemplate(requestBody);

    // Send email using Resend
    const response = await resend.emails.send({
      from: `${requestBody.schoolName} <notifications@educore.app>`,
      to: requestBody.recipient.email,
      subject: subject,
      html: html,
    });

    if (response.error) {
      console.error("Resend error:", response.error);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: response.error,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        emailId: response.data?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
