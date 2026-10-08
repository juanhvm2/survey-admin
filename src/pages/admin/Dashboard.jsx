import { useSurveys } from '@/hooks/useSurveys';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, FileText, CheckCircle2, XCircle, MessageSquare,
  ExternalLink, Copy, Edit, Trash2, CopyPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { responsesService } from '@/services/responsesService';
import toast from 'react-hot-toast';

const statusBadge = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
};
const statusLabel = {
  draft: 'Borrador', active: 'Activa', paused: 'Pausada', closed: 'Cerrada',
};

export default function Dashboard() {
  const { surveys, loading, refresh } = useSurveys();
  const [responsesCount, setResponsesCount] = useState({});

  useEffect(() => {
    const load = async () => {
      const counts = {};
      for (const s of surveys) {
        const r = await responsesService.listBySurvey(s.id);
        counts[s.id] = r.length;
      }
      setResponsesCount(counts);
    };
    if (surveys.length) load();
  }, [surveys]);

  const totalResponses = Object.values(responsesCount).reduce((a, b) => a + b, 0);
  const activeCount = surveys.filter((s) => s.status === 'active').length;
  const closedCount = surveys.filter((s) => s.status === 'closed').length;

  const copyUrl = (slug) => {
    const url = `${window.location.origin}/survey/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta encuesta?')) return;
    await import('@/services/surveysService').then((m) =>
      m.surveysService.delete(id),
    );
    await refresh();
    toast.success('Encuesta eliminada');
  };

  const handleDuplicate = async (id) => {
    await import('@/services/surveysService').then((m) =>
      m.surveysService.duplicate(id),
    );
    await refresh();
    toast.success('Encuesta duplicada');
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Gestiona todas tus encuestas</p>
        </div>
        <Link to="/admin/surveys/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva encuesta
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total encuestas', value: surveys.length, icon: FileText },
          { label: 'Activas', value: activeCount, icon: CheckCircle2 },
          { label: 'Cerradas', value: closedCount, icon: XCircle },
          { label: 'Respuestas', value: totalResponses, icon: MessageSquare },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon className="text-primary-600" size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Todas las encuestas</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-left text-sm text-gray-500 border-b">
              <tr>
                <th className="pb-3">Nombre</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3">Preguntas</th>
                <th className="pb-3">Respuestas</th>
                <th className="pb-3">Publicada en</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-4">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-gray-500">{s.description}</div>
                  </td>
                  <td>
                    <span className={`chip ${statusBadge[s.status]}`}>
                      {statusLabel[s.status]}
                    </span>
                  </td>
                  <td>{s.questions?.length || 0}</td>
                  <td>{responsesCount[s.id] || 0}</td>
                  <td className="text-xs text-gray-500 max-w-[200px] truncate">
                    {s.publishedUrl || '—'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/admin/surveys/${s.id}/results`} className="p-2 hover:bg-gray-100 rounded-lg" title="Ver resultados">
                        <ExternalLink size={16} />
                      </Link>
                      <Link to={`/admin/surveys/${s.id}`} className="p-2 hover:bg-gray-100 rounded-lg" title="Editar">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => copyUrl(s.publicSlug)} className="p-2 hover:bg-gray-100 rounded-lg" title="Copiar URL">
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDuplicate(s.id)} className="p-2 hover:bg-gray-100 rounded-lg" title="Duplicar">
                        <CopyPlus size={16} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay encuestas. Crea la primera.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}