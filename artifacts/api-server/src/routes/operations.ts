import { Router, type IRouter } from "express";
import { cases, demoState, incident, tasks } from "./demo-data";

const router: IRouter = Router();

router.get("/command/summary", (_req, res) => {
  res.json({
    incident,
    metrics: { backlog: 3, highPriority: 2, openTasks: 2, overdueTasks: 1, confirmationRate: 71, slaCompliance: 67 },
    cases: cases.slice(0, 5),
    tasks,
    activity: [
      { title: "Field verification synced for Corporation School 14", time: "08:42", tone: "success" },
      { title: "Hospital case promoted to Priority 83", time: "08:35", tone: "gold" },
      { title: "Bridge task breached SLA — escalation opened", time: "08:21", tone: "critical" },
      { title: "New imagery pair processed", time: "07:58", tone: "muted" },
    ],
  });
});

router.get("/incidents", (_req, res) => res.json([incident]));
router.post("/incidents", (req, res) => res.status(201).json({ ...incident, ...req.body, id: `inc-${Date.now()}`, updatedAt: new Date().toISOString() }));
router.get("/incidents/:id", (_req, res) => res.json(incident));
router.patch("/incidents/:id", (req, res) => res.json({ ...incident, ...req.body, updatedAt: new Date().toISOString() }));

router.get("/cases", (_req, res) => res.json(cases));
router.get("/cases/:id", (req, res) => {
  const found = cases.find((item) => item.id === req.params.id) ?? cases[0];
  res.json(found);
});
router.post("/cases/:id/review", (req, res) => {
  const found = cases.find((item) => item.id === req.params.id) ?? cases[0];
  found.reviewState = req.body.decision === "confirmed" ? "Confirmed" : req.body.decision === "rejected" ? "Rejected" : "Uncertain";
  found.status = req.body.decision === "confirmed" ? "tasked" : req.body.decision === "rejected" ? "closed" : "review";
  res.json(found);
});

router.get("/tasks", (_req, res) => res.json(tasks));
router.post("/tasks", (req, res) => {
  const task = { id: `task-${Date.now()}`, caseId: req.body.caseId, title: req.body.title, assignedTeam: req.body.assignedTeam, assignedUser: req.body.assignedUser ?? null, status: "Open", priority: 83, dueAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), slaLabel: "00:30:00", escalation: false };
  tasks.unshift(task);
  res.status(201).json(task);
});
router.patch("/tasks/:id", (req, res) => {
  const found = tasks.find((item) => item.id === req.params.id) ?? tasks[0];
  Object.assign(found, req.body);
  res.json(found);
});

router.post("/demo/load", (_req, res) => res.json(demoState()));
router.post("/demo/reset", (_req, res) => res.json(demoState()));

export default router;