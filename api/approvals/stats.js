export default function handler(req, res) {
  const stats = {
    pending: 3,
    approved: 5,
    rejected: 1
  };

  res.status(200).json(stats);
}
