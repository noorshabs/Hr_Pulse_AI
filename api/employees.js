export default function handler(req, res) {

let employees = [
{
id: 1,
name: "Rahul Sharma",
email: "rahul@company.com",
department: "Engineering",
status: "Active",

onboarding: {
progress: 60,
documents: ["ID Proof", "Resume"],
checklist: ["Offer Letter Signed", "Laptop Issued"]
}
},

{
id: 2,
name: "Priya Nair",
email: "priya@company.com",
department: "HR",
status: "Onboarding",

onboarding: {
progress: 30,
documents: ["ID Proof"],
checklist: ["Offer Letter Signed"]
}
}
]

if (req.method === "GET") {
res.status(200).json(employees)
}

else if (req.method === "POST") {

const newEmployee = {
id: employees.length + 1,
...req.body,
onboarding: {
progress: 0,
documents: [],
checklist: []
}
}

employees.push(newEmployee)

res.status(201).json(newEmployee)

}

}
