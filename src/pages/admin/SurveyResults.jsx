import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { surveysService } from '@/services/surveysService';
import { responsesService } from '@/services/responsesService';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SurveyResults() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    surveysService.get(id).then(setSurvey);
    responsesService.listBySurvey(id).then(setResponses);
  }, [id]);

  if (!survey) return <div className="p-8">Cargando...</div>;

  const stats = (q) => {
    const counts = {};
    q.options?.forEach((o) => (counts[o] = 0));
    responses.forEach((r) => {
      const a = r.answers?.[q.id];
      if (Array.isArray(a)) a.forEach((v) => counts[v]++);
      else if (a) counts[a] = (counts[a] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([name, value]) => ({
      name, value, percent: Math.round((value / total) * 100),
    }));
  };

  const exportExcel = () => {
    const rows = responses.map((r) => {
      const row = { Fecha: r.createdAt?.toDate?.().toLocaleString() || '', ID: r.respondentId };
      survey.questions.forEach((q) => {
        const a = r.answers?.[q.id];
        row[q.text] = Array.isArray(a) ? a.join(', ') : a;
      });
      return row;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas');
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `encuesta-${survey.title}-${today}.xlsx`);
  };

  const exportCSV = () => {
    const rows = responses.map((r) => {
      const row = { Fecha: r.createdAt?.toDate?.().toLocaleString() || '', ID: r.respondentId };
      survey.questions.forEach((q) => {
        const a = r.answers?.[q.id];
        row[q.text] = Array.isArray(a) ? a.join('; ') : a;
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `encuesta-${survey.title}-${today}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <p className="text-gray-500">{responses.length} respuestas recibidas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> CSV
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> XLSX
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input className="input pl-10" placeholder="Buscar respuestas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {survey.questions.map((q, i) => {
        const data = stats(q);
        const isClosed = ['single', 'multiple', 'yesno', 'scale'].includes(q.type);
        return (
          <div key={q.id} className="card">
            <h3 className="font-semibold mb-4">{i + 1}. {q.text}</h3>
            {isClosed && data.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  {data.map((d) => (
                    <div key={d.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{d.name}</span>
                        <span className="font-medium">{d.value} ({d.percent}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600" style={{ width: `${d.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {responses.filter((r) => {
                      const a = r.answers?.[q.id];
                      if (!search) return true;
                      return String(a).toLowerCase().includes(search.toLowerCase());
                    }).map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 text-gray-500 text-xs">{r.createdAt?.toDate?.().toLocaleString()}</td>
                        <td className="py-2">{Array.isArray(r.answers?.[q.id]) ? r.answers[q.id].join(', ') : r.answers?.[q.id]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}