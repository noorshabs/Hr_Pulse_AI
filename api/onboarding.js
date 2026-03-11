export default function handler(req, res) {

const onboardingData = [
{
id: 1,
name: "Rahul Sharma",
role: "Software Engineer",
progress: 60,
documents: [
{ name: "ID Proof", status: "Uploaded" },
{ name: "Resume", status: "Uploaded" },
{ name: "Offer Letter", status: "Pending" }
],
checklist: [
{ task: "Offer Letter Signed", done: true },
{ task: "Laptop Issued", done: false },
{ task: "HR Orientation", done: false }
]
},

{
id: 2,
name: "Priya Nair",
role: "HR Executive",
progress: 40,
documents: [
{ name: "ID Proof", status: "Uploaded" },
{ name: "Resume", status: "Pending" }
],
checklist: [
{ task: "Offer Letter Signed", done: true },
{ task: "HR Orientation", done: false }
]
}
]

res.status(200).json(onboardingData)

}
