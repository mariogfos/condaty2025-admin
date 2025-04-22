import CalendarExample, {
  Reservation,
} from "@/mk/components/Calendar/CalendarExample";

const page = () => {
  const initialReservations: Reservation[] = [
    {
      id: 1,
      date: "2025-04-15",
      start_time: "10:00",
      end_time: "12:00",
      status: "confirmed",
      owner_id: 1,
      owner_name: "John Doe",
    },
    {
      id: 2,
      date: "2025-04-15",
      start_time: "18:00",
      end_time: "20:00",
      status: "pending",
      owner_id: 2,
      owner_name: "Jane Smith",
    },
    {
      id: 2,
      date: "2025-04-16",
      start_time: "14:00",
      end_time: "16:00",
      status: "pending",
      owner_id: 2,
      owner_name: "Jane Smith",
    },
  ];
  return (
    <CalendarExample area_id={1} initialReservations={initialReservations} />
  );
};

export default page;
