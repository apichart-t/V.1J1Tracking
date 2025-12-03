import { db } from './firebaseConfig'; 
import { collection, onSnapshot } from 'firebaseConfig';
import {
  collection,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";

function App() {
  const [units, setUnits] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [records, setRecords] = useState([]);

  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [detail, setDetail] = useState("");

  // โหลดข้อมูลแบบ real-time
  useEffect(() => {
    // 1. โหลด units
    const unsubUnits = onSnapshot(
      collection(db, "units"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUnits(data);
      },
      (error) => console.error("Error fetching units:", error)
    );

    // 2. โหลด policies
    const unsubPolicies = onSnapshot(
      collection(db, "policies"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPolicies(data);
      },
      (error) => console.error("Error fetching policies:", error)
    );

    // 3. โหลด records
    const unsubRecords = onSnapshot(
      collection(db, "records"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecords(data);
      },
      (error) => console.error("Error fetching records:", error)
    );

    return () => {
      unsubUnits();
      unsubPolicies();
      unsubRecords();
    };
  }, []);

  // ฟังก์ชันบันทึกข้อมูล
  const saveRecord = async () => {
    if (!selectedUnit || !selectedPolicy || !detail.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    await addDoc(collection(db, "records"), {
      unitId: selectedUnit,
      policyId: selectedPolicy,
      detail,
      createdAt: Timestamp.now(),
    });

    setDetail("");
    alert("บันทึกข้อมูลสำเร็จ");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>ระบบบันทึกผลการดำเนินงาน นโยบาย ผบ.</h1>

      {/* เลือกหน่วย */}
      <label>เลือกหน่วยงาน:</label>
      <select
        value={selectedUnit}
        onChange={(e) => setSelectedUnit(e.target.value)}
      >
        <option value="">-- เลือกหน่วย --</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>

      {/* เลือกนโยบาย */}
      <label style={{ marginTop: "10px", display: "block" }}>
        เลือกนโยบาย:
      </label>
      <select
        value={selectedPolicy}
        onChange={(e) => setSelectedPolicy(e.target.value)}
      >
        <option value="">-- เลือกนโยบาย --</option>
        {policies.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      {/* รายละเอียด */}
      <label style={{ marginTop: "10px", display: "block" }}>
        รายละเอียดผลดำเนินการ:
      </label>
      <textarea
        rows={4}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />

      <button
        onClick={saveRecord}
        style={{ marginTop: "10px", padding: "8px 16px" }}
      >
        บันทึกข้อมูล
      </button>

      <hr style={{ margin: "30px 0" }} />

      <h2>ประวัติการบันทึก</h2>
      {records.map((r) => (
        <div
          key={r.id}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <strong>
            หน่วย: {units.find((u) => u.id === r.unitId)?.name || "-"}
          </strong>
          <br />
          นโยบาย: {policies.find((p) => p.id === r.policyId)?.title || "-"}
          <br />
          รายละเอียด: {r.detail}
        </div>
      ))}
    </div>
  );
}

export default App;
