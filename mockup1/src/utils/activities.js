/**
 * Activities surfaced in the "Record Activity" picker.
 *
 *  - `home`   → shown to parents (recording happens with family at home)
 *  - `school` → shown to teachers (recording happens in an early-childhood / PreK classroom for ages 3-5)
 *
 * Anything outside these curated lists is treated as a custom activity and validated
 * by the backend LLM (see backend/lib/activityValidator.js — must be kept in sync).
 */
export const PREDEFINED_ACTIVITY_GROUPS = {
  home: [
    {
      category: "Play time",
      activities: [
        "Puzzles",
        "Blocks",
        "Pretend play",
        "Games",
        "Baby dolls",
        "Cars",
        "Sensory toys",
        "Playing (general)",
        "Sports (e.g., soccer, basketball)",
        "Screen time (e.g., movie/show, iPad/tablet/phone, video games)",
      ],
    },
    {
      category: "Personal care",
      activities: [
        "Waking up",
        "Diapering",
        "Potty time",
        "Dressing",
        "Nap time",
        "Brushing teeth",
        "Bath time",
        "Bed time",
        "Sleeping",
      ],
    },
    {
      category: "Outdoor play",
      activities: [
        "Ride-ons",
        "Playing ball",
        "Swinging",
        "Sliding",
        "Water play",
      ],
    },
    {
      category: "Eating & drinking",
      activities: [
        "Bottle time",
        "Breakfast",
        "Lunch",
        "Dinner",
        "Snacks",
        "Water breaks",
      ],
    },
    {
      category: "Outings",
      activities: [
        "Car rides",
        "Bus rides",
        "Walks",
        "Visiting family and friends",
        "Shopping",
        "Getting the mail",
        "Traveling to/from activity",
      ],
    },
    {
      category: "Household chores",
      activities: [
        "Laundry",
        "Wiping up tables",
        "Throwing away trash",
        "Picking up toys",
        "Putting dishes in sink",
        "Clean-up, set-up, transition",
      ],
    },
    {
      category: "Books & literacy",
      activities: [
        "Reading together",
        "Playing with cloth or board books",
        "Talking about pictures",
        "Reading or looking at books",
      ],
    },
    {
      category: "Structured activities",
      activities: [
        "Circle time",
        "Music time",
        "Library story time",
        "Story time",
        "Art",
        "Playdough",
        "Coloring",
        "Centers",
        "Large group",
        "Small group",
        "Individual activity",
        "Other",
        "School work",
        "Faith-based activities",
        "Therapy",
      ],
    },
  ],

  school: [
    {
      category: "Arrival, transitions & routines",
      activities: [
        "Arrival / drop-off",
        "Morning greeting / sign-in",
        "Hand washing",
        "Bathroom break",
        "Diapering",
        "Line up",
        "Hallway transition",
        "Dismissal / pick-up",
      ],
    },
    {
      category: "Circle time & group meetings",
      activities: [
        "Circle time",
        "Morning meeting",
        "Calendar time",
        "Weather chart",
        "Attendance",
        "Question of the day",
        "Show and tell",
        "Class meeting",
      ],
    },
    {
      category: "Literacy & books",
      activities: [
        "Story time / read aloud",
        "Shared reading",
        "Letter & phonics activities",
        "Rhyming and word games",
        "Alphabet practice",
        "Writing or journaling",
        "Library / listening center",
        "Talking about pictures",
      ],
    },
    {
      category: "Math, science & sensory",
      activities: [
        "Counting and number games",
        "Sorting and patterning",
        "Shape and color activities",
        "Measuring activities",
        "Math manipulatives",
        "Science experiments",
        "Nature exploration",
        "Sensory table",
        "Sensory bin",
      ],
    },
    {
      category: "Art, music & movement",
      activities: [
        "Art and crafts",
        "Coloring",
        "Painting",
        "Drawing",
        "Playdough or clay",
        "Collage",
        "Cutting and gluing",
        "Music time",
        "Singing",
        "Dancing",
        "Movement games",
        "Musical instruments",
      ],
    },
    {
      category: "Centers & free play",
      activities: [
        "Free play / free choice",
        "Blocks center",
        "Dramatic play / pretend play",
        "Kitchen / housekeeping center",
        "Construction and building",
        "Puzzles and manipulatives",
        "Cars and trucks",
        "Sand or water play",
      ],
    },
    {
      category: "Meals, snacks & outdoor play",
      activities: [
        "Breakfast",
        "Morning snack",
        "Lunch",
        "Afternoon snack",
        "Outdoor play / recess",
        "Playground time",
        "Riding tricycles or ride-ons",
        "Ball games",
        "Climbing structures",
        "Garden time",
      ],
    },
    {
      category: "Rest, services & special events",
      activities: [
        "Nap time",
        "Quiet / rest time",
        "Speech therapy",
        "Occupational therapy",
        "Physical therapy",
        "Small group instruction",
        "Large group instruction",
        "Individual instruction",
        "Field trip",
        "Class celebration / holiday",
      ],
    },
  ],
};

export const CUSTOM_ACTIVITY_VALUE = "__custom__";

/**
 * @param {"teacher"|"parent"} role
 * @returns {{category: string, activities: string[]}[]}
 */
export function getActivityGroupsForRole(role) {
  return role === "teacher"
    ? PREDEFINED_ACTIVITY_GROUPS.school
    : PREDEFINED_ACTIVITY_GROUPS.home;
}
