// Dummy data for testing the mockup

export const initializeDummyData = () => {
  // Check if data already exists
  const existingTeachers = localStorage.getItem("teachers");
  const existingChildren = localStorage.getItem("children");

  // Only initialize if no data exists
  if (!existingTeachers || JSON.parse(existingTeachers).length === 0) {
    const dummyTeachers = [
      {
        id: 1,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@bainumproject.edu",
        education: "Master's in Early Childhood Education",
        dateOfBirth: "1985-03-15",
        center: "Center A",
      },
      {
        id: 2,
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@bainumproject.edu",
        education: "Bachelor's in Elementary Education",
        dateOfBirth: "1990-07-22",
        center: "Center A",
      },
      {
        id: 3,
        firstName: "Emily",
        lastName: "Rodriguez",
        email: "emily.rodriguez@bainumproject.edu",
        education: "Master's in Special Education",
        dateOfBirth: "1988-11-08",
        center: "Center B",
      },
      {
        id: 4,
        firstName: "David",
        lastName: "Patel",
        email: "david.patel@bainumproject.edu",
        education: "Bachelor's in Child Development",
        dateOfBirth: "1992-05-30",
        center: "Center B",
      },
    ];

    localStorage.setItem("teachers", JSON.stringify(dummyTeachers));
  }

  if (!existingChildren || JSON.parse(existingChildren).length === 0) {
    const dummyChildren = [
      // Children for Sarah Johnson
      {
        id: 101,
        firstName: "Emma",
        lastName: "Williams",
        dateOfBirth: "2019-04-12",
        gender: "Female",
        diagnosis: "No",
        primaryLanguage: "English",
        leadTeacher: "Sarah Johnson",
      },
      {
        id: 102,
        firstName: "Noah",
        lastName: "Brown",
        dateOfBirth: "2018-09-25",
        gender: "Male",
        diagnosis: "Yes",
        primaryLanguage: "English",
        leadTeacher: "Sarah Johnson",
      },
      {
        id: 103,
        firstName: "Sophia",
        lastName: "Davis",
        dateOfBirth: "2019-01-18",
        gender: "Female",
        diagnosis: "No",
        primaryLanguage: "Spanish",
        leadTeacher: "Sarah Johnson",
      },
      // Children for Michael Chen
      {
        id: 104,
        firstName: "Liam",
        lastName: "Martinez",
        dateOfBirth: "2018-12-05",
        gender: "Male",
        diagnosis: "No",
        primaryLanguage: "English",
        leadTeacher: "Michael Chen",
      },
      {
        id: 105,
        firstName: "Olivia",
        lastName: "Garcia",
        dateOfBirth: "2019-06-20",
        gender: "Female",
        diagnosis: "Yes",
        primaryLanguage: "Spanish",
        leadTeacher: "Michael Chen",
      },
      {
        id: 106,
        firstName: "Ethan",
        lastName: "Lee",
        dateOfBirth: "2019-03-14",
        gender: "Male",
        diagnosis: "No",
        primaryLanguage: "Mandarin",
        leadTeacher: "Michael Chen",
      },
      // Children for Emily Rodriguez
      {
        id: 107,
        firstName: "Ava",
        lastName: "Anderson",
        dateOfBirth: "2018-08-30",
        gender: "Female",
        diagnosis: "Yes",
        primaryLanguage: "English",
        leadTeacher: "Emily Rodriguez",
      },
      {
        id: 108,
        firstName: "Mason",
        lastName: "Taylor",
        dateOfBirth: "2019-02-17",
        gender: "Male",
        diagnosis: "No",
        primaryLanguage: "English",
        leadTeacher: "Emily Rodriguez",
      },
      {
        id: 109,
        firstName: "Isabella",
        lastName: "Hernandez",
        dateOfBirth: "2018-11-22",
        gender: "Female",
        diagnosis: "Yes",
        primaryLanguage: "Spanish",
        leadTeacher: "Emily Rodriguez",
      },
      {
        id: 110,
        firstName: "Lucas",
        lastName: "Wilson",
        dateOfBirth: "2019-05-09",
        gender: "Male",
        diagnosis: "No",
        primaryLanguage: "English",
        leadTeacher: "Emily Rodriguez",
      },
      // Children for David Patel
      {
        id: 111,
        firstName: "Mia",
        lastName: "Thomas",
        dateOfBirth: "2018-10-11",
        gender: "Female",
        diagnosis: "No",
        primaryLanguage: "English",
        leadTeacher: "David Patel",
      },
      {
        id: 112,
        firstName: "James",
        lastName: "Moore",
        dateOfBirth: "2019-07-28",
        gender: "Male",
        diagnosis: "Yes",
        primaryLanguage: "English",
        leadTeacher: "David Patel",
      },
      {
        id: 113,
        firstName: "Charlotte",
        lastName: "Jackson",
        dateOfBirth: "2018-12-15",
        gender: "Female",
        diagnosis: "No",
        primaryLanguage: "French",
        leadTeacher: "David Patel",
      },
    ];

    localStorage.setItem("children", JSON.stringify(dummyChildren));
  }
};



