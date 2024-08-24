type Publication = Database["public"]["Tables"]["publications"]["Row"];
type Attendance = Database["public"]["Tables"]["attendance"]["Row"];

interface Publication {
  id: string;
  user_address: string;
  title: string;
  content: string;
  restaurant: string;
  longitude: number;
  latitude: number;
  published_at: string;
  created_at: string;
  serial_number: number;
  votes: number;
}

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];
