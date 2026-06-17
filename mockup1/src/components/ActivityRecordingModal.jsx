import ActivityRecordingForm from "./ActivityRecordingForm.jsx";

/** @deprecated Prefer ActivityRecordingForm with variant="page" on ParentHomeRecordingPage. */
export default function ActivityRecordingModal(props) {
  return <ActivityRecordingForm {...props} variant="modal" />;
}
