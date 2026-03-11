export default function handler(req, res) {
  const onboarding = {
    employees: [
      {
        id: 1,
        name: "John Doe",
        role: "Software Developer",
        department: "Engineering",
        progress: 60
      },
      {
        id: 2,
        name: "Jane Smith",
        role: "HR Manager",
        department: "Human Resources",
        progress: 80
      }
    ],
    documents: [
      {
        employee: "John Doe",
        uploaded: ["ID Proof", "Offer Letter"],
        pending: ["Bank Details"]
      },
      {
        employee: "Jane Smith",
        uploaded: ["ID Proof", "Offer Letter", "Bank Details"],
        pending: []
      }
    ],
    checklist: [
      { task: "Submit Documents", status: "Completed" },
      { task: "HR Orientation", status: "Pending" },
      { task: "System Setup", status: "Pending" }
    ]
  };

  res.status(200).json(onboarding);
}
