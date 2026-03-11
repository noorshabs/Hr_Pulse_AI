export default function handler(req, res) {
  const approvals = [
    { id: 1, request: "Leave Request", status: "Pending" },
    { id: 2, request: "Expense Claim", status: "Approved" }
  ];

  res.status(200).json(approvals);
}
