# Bainum Project

A comprehensive web application for managing child assessments, teacher administration, and parent access to child data. The system uses Automatic Speech Recognition (ASR) to transcribe audio recordings and analyze them for educational keyword tracking.

## 🏗️ Project Structure

```
Main/
├── backend/          # Node.js/Express backend server
│   ├── config/      # Database and service configurations
│   ├── controllers/ # Request handlers
│   ├── lib/         # Utility libraries (RevAI, email service)
│   ├── middleware/  # Authentication and rate limiting
│   ├── models/      # MongoDB/Mongoose models
│   ├── routes/      # API route definitions
│   └── src/         # Server entry point
│
└── mockup1/         # React frontend application
    ├── src/
    │   ├── components/  # Reusable React components
    │   ├── contexts/     # React contexts (Auth)
    │   ├── pages/        # Page components
    │   └── utils/        # Utility functions
    └── public/           # Static assets
```

## ✨ Features

### User Roles
- **Admin**: Full system access, can manage teachers, children, and view all data
- **Teacher**: Can view and manage their assigned children, upload recordings
- **Parent**: Can view only their child's data page (restricted access)

### Core Functionality
- **Audio Transcription**: Upload audio recordings for automatic transcription using RevAI
- **Keyword Analysis**: Tracks keywords related to:
  - Science
  - Social development
  - Literature
  - Language development
- **Data Visualization**: 
  - Monthly dot matrix showing keyword frequency
  - Speedometer gauges for each category
  - Progress tracking over time
- **Invitation System**: 
  - Teachers can invite parents via email
  - Admins can invite teachers via email
  - Secure token-based registration
- **Assessment Management**: 
  - Review transcripts before saving
  - Accept/reject transcriptions
  - View and download transcripts (admin only)
- **Notes & Observations**: Add and manage notes for each child

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Main
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../mockup1
   npm install
   ```

### Configuration

1. **Backend Environment Variables**

   Copy `backend/env.example.txt` to `backend/.env` and fill in your values:
   ```bash
   cd backend
   cp env.example.txt .env
   ```

   Required environment variables:
   - `MONGO_URI`: MongoDB connection string
   - `REVAI_API_KEY`: RevAI API key for speech recognition
   - `JWT_SECRET`: Secret key for JWT tokens (generate with: `openssl rand -base64 32`)
   - `PORT`: Server port (default: 5000)
   - `FRONTEND_URL`: Frontend URL (default: http://localhost:5173)

   Optional (for email invitations):
   - `EMAIL_SERVICE`: Email service provider (e.g., gmail)
   - `EMAIL_USER`: Email address
   - `EMAIL_PASSWORD` or `EMAIL_APP_PASSWORD`: Email password/app password
   - `EMAIL_FROM_NAME`: Sender name

   Optional (for rate limiting):
   - `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token

2. **Frontend Configuration**

   The frontend is configured to connect to `http://localhost:5000` by default. Update the API base URL in your axios configuration if needed.

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd mockup1
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Login with admin credentials or register a new account

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin/teacher
- `POST /api/auth/login` - Login
- `POST /api/auth/register-parent` - Register parent with invitation token
- `POST /api/auth/register-teacher` - Register teacher with invitation token

### Children
- `GET /api/children` - Get all children
- `POST /api/children` - Create a new child
- `GET /api/children/:id` - Get child by ID
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create a new teacher (admin only)
- `GET /api/teachers/:id` - Get teacher by ID
- `DELETE /api/teachers/:id` - Delete teacher

### Assessments
- `POST /api/whisper/transcribe` - Upload and transcribe audio
- `POST /api/whisper/assessments/accept` - Accept and save assessment

### Invitations
- `POST /api/invitations/send` - Send parent invitation
- `GET /api/invitations/verify/:token` - Verify invitation token
- `GET /api/invitations` - List all invitations
- `GET /api/invitations/child/:childId` - Get invitations for a child

### Teacher Invitations
- `POST /api/teacher-invitations/send` - Send teacher invitation
- `GET /api/teacher-invitations/verify/:token` - Verify teacher invitation token
- `GET /api/teacher-invitations/list` - List all teacher invitations

### Notes
- `GET /api/notes/child/:childId` - Get notes for a child
- `POST /api/notes` - Create a new note
- `DELETE /api/notes/:id` - Delete a note

## 🔐 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for admin, teacher, and parent roles
- **Rate Limiting**: API rate limiting using Upstash Redis (with in-memory fallback)
- **Protected Routes**: Frontend route protection based on user roles
- **Token-Based Invitations**: Secure invitation system for parents and teachers

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **RevAI** - Automatic Speech Recognition API
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **nodemailer** - Email service
- **multer** - File upload handling
- **@upstash/ratelimit** - Rate limiting

### Frontend
- **React** - UI framework
- **React Router** - Routing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **D3.js** - Data visualization
- **Lucide React** - Icons

## 📝 Development Notes

### Adding a New Child
1. Navigate to the Data page
2. Click "Add Child"
3. Fill in child details (name, date of birth, gender, diagnosis, language, lead teacher)
4. Submit the form

### Uploading a Recording
1. Navigate to a child's data page
2. Click "Upload Recording"
3. Select an audio file and enter the recording date
4. Wait for transcription (RevAI processing)
5. Review the transcript in the popup
6. Accept or reject the transcript
7. If accepted, the assessment is saved and visualized

### Sending Invitations
1. **Parent Invitation**: 
   - Go to Data page
   - Click "Invite" next to a child
   - Enter parent email
   - Send invitation

2. **Teacher Invitation**:
   - Go to Teachers page
   - Click "Invite" next to a teacher
   - Enter email (pre-filled with teacher's email)
   - Send invitation

## 🐛 Troubleshooting

### Backend won't start
- Check that MongoDB is running and `MONGO_URI` is correct
- Verify all required environment variables are set
- Check that port 5000 is not already in use

### Email invitations not sending
- Verify email credentials in `.env` file
- For Gmail, use an App Password instead of regular password
- Check that `FRONTEND_URL` is correctly set
- Check backend logs for email errors

### Transcription not working
- Verify `REVAI_API_KEY` is set correctly
- Check RevAI API quota/limits
- Ensure audio file format is supported

### Login issues
- Verify JWT_SECRET is set
- Check that passwords are correctly hashed in database
- Clear browser localStorage and try again

## 📄 License

[Specify your license here]

## 👥 Contributors

[Add contributors here]

## 📧 Contact

vashisthegde@ufl.edu

