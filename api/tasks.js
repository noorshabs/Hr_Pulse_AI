export default function handler(req, res) {
  const tasks = [
    { id: 1, task: "Complete onboarding documents", status: "Pending" },
    { id: 2, task: "Attend HR training", status: "Completed" }
  ];

  res.status(200).json(tasks);
}
