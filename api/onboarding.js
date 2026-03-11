export default function handler(req, res) {
  const onboarding = [
    {
      id: 1,
      employeeName: "John Doe",
      documents: ["ID Proof", "Offer Letter", "Bank Details"],
      checklist: [
        { task: "Submit documents", status: "Completed" },
        { task: "Create company email", status: "Pending" },
        { task: "Complete HR orientation", status: "Pending" }
      ],
      progress: 33
    },
    {
      id: 2,
      employeeName: "Jane Smith",
      documents: ["ID Proof", "Offer Letter"],
      checklist: [
        { task: "Submit documents", status: "Completed" },
        { task: "Setup workstation", status: "Completed" },
        { task: "Attend onboarding session", status: "Pending" }
      ],
      progress: 66
    }
  ];

  res.status(200).json(onboarding);
}
