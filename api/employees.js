export default function handler(req, res) {
  const employees = [
    {
      id: 1,
      name: "John Doe",
      email: "john@company.com",
      department: "Engineering",
      position: "Software Developer",
      status: "Active"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@company.com",
      department: "Human Resources",
      position: "HR Manager",
      status: "Active"
    }
  ];

  res.status(200).json(employees);
}
