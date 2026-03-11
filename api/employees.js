export default function handler(req, res) {
  if (req.method === "GET") {
    const employees = [
      { id: 1, name: "John Doe", role: "Developer" },
      { id: 2, name: "Jane Smith", role: "HR Manager" }
    ];
    res.status(200).json(employees);
  }

  if (req.method === "POST") {
    const newEmployee = req.body;
    res.status(200).json({
      message: "Employee added successfully",
      employee: newEmployee
    });
  }
}
