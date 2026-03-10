import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("hr_platform.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    department TEXT,
    status TEXT DEFAULT 'active',
    join_date TEXT
  );

  CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_email TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS onboarding_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

// Seed some initial data if empty
const employeeCount = db.prepare("SELECT COUNT(*) as count FROM employees").get() as { count: number };
if (employeeCount.count === 0) {
  db.prepare("INSERT INTO employees (name, email, role, department, status, join_date) VALUES (?, ?, ?, ?, ?, ?)").run(
    "John Doe", "john.doe@example.com", "Software Engineer", "Engineering", "active", "2023-01-15"
  );
  db.prepare("INSERT INTO policies (title, content, category) VALUES (?, ?, ?)").run(
    "Leave Policy", "Employees are entitled to 20 days of paid annual leave. Sick leave is 10 days per year.", "Benefits"
  );
  db.prepare("INSERT INTO policies (title, content, category) VALUES (?, ?, ?)").run(
    "Remote Work Policy", "Employees can work remotely up to 3 days a week with manager approval.", "Operations"
  );

  // Add some seed approvals
  db.prepare("INSERT INTO approvals (type, details, status, requested_by) VALUES (?, ?, ?, ?)").run(
    "LEAVE_REQUEST", JSON.stringify({ employee: "John Doe", days: 5, reason: "Vacation" }), "approved", "John Doe"
  );
  db.prepare("INSERT INTO approvals (type, details, status, requested_by) VALUES (?, ?, ?, ?)").run(
    "LEAVE_REQUEST", JSON.stringify({ employee: "Jane Smith", days: 2, reason: "Personal" }), "pending", "Jane Smith"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  app.get("/api/employees", (req, res) => {
    const employees = db.prepare("SELECT * FROM employees").all();
    res.json(employees);
  });

  app.post("/api/employees", (req, res) => {
    const { name, email, role, department, join_date } = req.body;
    try {
      const result = db.prepare("INSERT INTO employees (name, email, role, department, join_date, status) VALUES (?, ?, ?, ?, ?, ?)").run(
        name, email, role, department, join_date || new Date().toISOString().split('T')[0], 'onboarding'
      );
      const employeeId = result.lastInsertRowid;

      // Initialize onboarding items
      const defaultItems = [
        { category: 'Documents Collection', label: 'Identity Proof (Passport/ID)', status: 'pending' },
        { category: 'Documents Collection', label: 'Educational Certificates', status: 'pending' },
        { category: 'Account & System Setup', label: 'Corporate Email', status: 'not generated' },
        { category: 'Account & System Setup', label: 'Employee ID', status: 'not generated' },
        { category: 'Account & System Setup', label: 'Slack Access', status: 'not generated' },
        { category: 'Account & System Setup', label: 'Salesforce License', status: 'not generated' },
        { category: 'Personal Forms & Agreements', label: 'NDA Agreement', status: 'pending' },
        { category: 'Personal Forms & Agreements', label: 'Code of Conduct', status: 'pending' },
        { category: 'Personal Forms & Agreements', label: 'Emergency Contact Form', status: 'pending' }
      ];

      const insertItem = db.prepare("INSERT INTO onboarding_items (employee_id, category, label, status) VALUES (?, ?, ?, ?)");
      for (const item of defaultItems) {
        insertItem.run(employeeId, item.category, item.label, item.status);
      }

      res.json({ success: true, id: employeeId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/onboarding/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    const items = db.prepare("SELECT * FROM onboarding_items WHERE employee_id = ?").all(employeeId);
    res.json(items);
  });

  app.patch("/api/onboarding/items/:id", (req, res) => {
    const { id } = req.params;
    const { status, value } = req.body;
    try {
      db.prepare("UPDATE onboarding_items SET status = ?, value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        status, value, id
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
    res.json(tasks);
  });

  app.get("/api/approvals", (req, res) => {
    // Return all approvals for the dashboard, but maybe filter by status if needed
    const approvals = db.prepare("SELECT * FROM approvals ORDER BY created_at DESC").all();
    res.json(approvals);
  });

  app.get("/api/approvals/stats", (req, res) => {
    const pending = db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'").get() as any;
    const approvedLeave = db.prepare("SELECT COUNT(*) as count FROM approvals WHERE type = 'LEAVE_REQUEST' AND status = 'approved'").get() as any;
    const total = db.prepare("SELECT COUNT(*) as count FROM approvals").get() as any;
    
    res.json({
      pending: pending.count,
      approvedLeave: approvedLeave.count,
      total: total.count
    });
  });

  app.post("/api/approvals/:id/action", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approved' or 'rejected'
    
    const approval = db.prepare("SELECT * FROM approvals WHERE id = ?").get() as any;
    if (!approval) return res.status(404).json({ error: "Approval not found" });

    db.prepare("UPDATE approvals SET status = ? WHERE id = ?").run(action, id);

    if (action === 'approved') {
      const details = JSON.parse(approval.details);
      if (approval.type === 'CREATE_EMPLOYEE') {
        db.prepare("INSERT INTO employees (name, email, role, department, status, join_date) VALUES (?, ?, ?, ?, ?, ?)").run(
          details.name, details.email, details.role, details.department, 'onboarding', new Date().toISOString().split('T')[0]
        );
      } else if (approval.type === 'OFFBOARD_EMPLOYEE') {
        db.prepare("UPDATE employees SET status = 'offboarding' WHERE email = ?").run(details.email);
      }
    }

    res.json({ success: true });
  });

  // --- AI Agent Logic ---
  
  // Function Declarations for Gemini
  const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
    functionDeclarations: [
      {
        name: "get_employee_info",
        description: "Get information about an employee by their email.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING, description: "The email address of the employee." }
          },
          required: ["email"]
        }
      },
      {
        name: "search_policies",
        description: "Search HR policies and guidelines.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: "The search query for policies." }
          },
          required: ["query"]
        }
      },
      {
        name: "request_approval",
        description: "Request human approval for sensitive actions like creating or offboarding employees.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["CREATE_EMPLOYEE", "OFFBOARD_EMPLOYEE", "SALARY_CHANGE"], description: "The type of action requiring approval." },
            details: { type: Type.OBJECT, description: "The details of the action (e.g., name, email, role)." }
          },
          required: ["type", "details"]
        }
      },
      {
        name: "create_task",
        description: "Create an administrative task for an employee workflow (e.g., 'Revoke IT access').",
        parameters: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING, description: "The email of the employee related to the task." },
            description: { type: Type.STRING, description: "The task description." },
            taskType: { type: Type.STRING, description: "The category of the task (e.g., 'IT', 'Payroll', 'LMS')." }
          },
          required: ["email", "description", "taskType"]
        }
      }
    ]
  }];

  const toolImplementations: Record<string, Function> = {
    get_employee_info: ({ email }: { email: string }) => {
      return db.prepare("SELECT * FROM employees WHERE email = ?").get(email) || { error: "Employee not found" };
    },
    search_policies: ({ query }: { query: string }) => {
      return db.prepare("SELECT * FROM policies WHERE title LIKE ? OR content LIKE ?").all(`%${query}%`, `%${query}%`);
    },
    request_approval: ({ type, details }: { type: string, details: any }) => {
      db.prepare("INSERT INTO approvals (type, details, requested_by) VALUES (?, ?, ?)").run(
        type, JSON.stringify(details), "AI Agent"
      );
      return { message: `Approval request for ${type} has been submitted to HR.` };
    },
    create_task: ({ email, description, taskType }: { email: string, description: string, taskType: string }) => {
      db.prepare("INSERT INTO tasks (employee_email, description, type) VALUES (?, ?, ?)").run(
        email, description, taskType
      );
      return { message: `Task '${description}' created for ${email}.` };
    }
  };

  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        return res.status(400).json({ 
          error: "Gemini API Key is missing or invalid. Please set a valid GEMINI_API_KEY in the Secrets panel." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3.1-pro-preview";
      
      const contents = [...(history || []), { role: 'user', parts: [{ text: message }] }];
      
      let response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: `You are an HR Pulse AI Agent. Your goal is to assist HR staff and employees with HR operations.
          You can look up employee info, search policies, create tasks, and request approvals for sensitive actions.
          Sensitive actions (Creating employees, Offboarding, Salary changes) MUST go through the 'request_approval' tool.
          When offboarding an employee, you should also create relevant tasks like 'Revoke IT access' and 'Final payroll settlement'.
          Be professional, helpful, and concise.`,
          tools
        }
      });

      // Handle function calls
      while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
        const parts = response.candidates[0].content.parts;
        contents.push({ role: 'model', parts });

        const functionResponses = [];
        for (const part of parts) {
          if (part.functionCall) {
            const call = part.functionCall;
            const implementation = toolImplementations[call.name];
            if (implementation) {
              const result = await implementation(call.args);
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: { result }
                }
              });
            }
          }
        }
        
        contents.push({ role: 'user', parts: functionResponses });

        response = await ai.models.generateContent({
          model,
          contents,
          config: { tools }
        });
      }

      const finalContent = response.candidates?.[0]?.content;
      if (finalContent) {
        contents.push(finalContent);
      }

      res.json({ text: response.text, history: contents });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
