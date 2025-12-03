import { GoogleGenAI } from "@google/genai";
import { Report, Unit } from "../types";

export const generateExecutiveSummary = async (
  reports: Report[],
  units: Unit[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "ไม่สามารถวิเคราะห์ข้อมูลได้เนื่องจากไม่มี API Key (กรุณาตั้งค่า process.env.API_KEY)";

  if (reports.length === 0) return "ยังไม่มีข้อมูลรายงานสำหรับการวิเคราะห์";

  const ai = new GoogleGenAI({ apiKey });

  // Prepare concise context data to save tokens and focus on latest status
  const reportSummary = reports.map((r, index) => 
    `${index + 1}. โครงการ: ${r.projectName} (${units.find(u => u.id === r.unitId)?.shortName || 'ไม่ระบุหน่วย'})
     - สถานะ: ${r.progress}%
     - ผลการปฏิบัติโดยย่อ: ${r.pastPerformance.substring(0, 150)}${r.pastPerformance.length > 150 ? '...' : ''}
     - ปัญหา/อุปสรรค: ${r.obstacles || '-'}`
  ).join('\n');

  const prompt = `
    บทบาท: คุณคือเสนาธิการทหาร (J1) ผู้เชี่ยวชาญด้านการวิเคราะห์ยุทธศาสตร์และกำลังพล
    
    คำสั่ง: กรุณาวิเคราะห์ข้อมูล "รายงานผลการดำเนินงานด้านกำลังพล ประจำปี 2569" ที่ให้มาด้านล่าง และเขียน "บทสรุปผู้บริหาร (Executive Summary)" เพื่อนำเสนอ ผบ.ทสส.
    
    ข้อมูลรายงาน:
    ${reportSummary}
    
    รูปแบบการเขียนตอบ (Format):
    ขอภาษาไทยที่เป็นทางการทหาร กระชับ ชัดเจน ตรงประเด็น แบ่งเป็นหัวข้อดังนี้:
    
    1. ภาพรวมความสำเร็จ (Executive Overview)
       - สรุปภาพรวมความก้าวหน้าของทุกโครงการในภาพรวม
       - ระบุหน่วยหรือโครงการที่มีผลงานโดดเด่นน่าชื่นชม
       
    2. ประเด็นที่ต้องเพ่งเล็ง/ความเสี่ยง (Critical Issues & Risks)
       - ระบุโครงการที่มีความล่าช้า หรือมีปัญหาอุปสรรคที่สำคัญ (Red Flags)
       - วิเคราะห์สาเหตุเบื้องต้นจากข้อมูล
       
    3. ข้อพิจารณาและข้อเสนอแนะ (Recommendations)
       - ข้อเสนอแนะเชิงกลยุทธ์เพื่อให้บรรลุเป้าหมายในปีงบประมาณ 2569
    
    หมายเหตุ: ไม่ต้องเกริ่นนำว่า "นี่คือบทสรุป..." ให้เริ่มเนื้อหาหัวข้อที่ 1 เลย
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Low temperature for more factual/analytical output
      }
    });
    return response.text || "ไม่สามารถสร้างคำตอบได้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI: " + (error instanceof Error ? error.message : String(error));
  }
};