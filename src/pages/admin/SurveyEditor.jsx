import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveysService } from '@/services/surveysService';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Trash2, GripVertical, Copy, ChevronDown, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'single', label: 'Opción única' },
  { value: 'multiple', label: 'Múltiples opciones' },
  { value: 'short', label: 'Respuesta corta' },
  { value: 'long', label: 'Respuesta larga' },
  { value: 'number', label: 'Número' },
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'yesno', label: 'Sí / No' },
  { value: 'email', label: 'Email' },
];

function QuestionCard({ q, index, update, remove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const updateField = (field, value) => update({ ...q, [field]: value });
  const updateOption = (i, val) => {
    const opts = [...q.options];
    opts[i] = val;
    update({ ...q, options: opts });
  };
  const addOption = () => update({ ...q, options: [...(q.options || []), ''] });
  const removeOption = (i) => {
    const opts = q.options.filter((_, idx) => idx !== i);
    update({ ...q, options: opts });
  };

  const hasOptions = ['single', 'multiple'].includes(q.type);

  return (
    <div ref={setNodeRef} style={style} className="card mb-3">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-2 cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical size={18} />
        </button>
        <div className="flex-1 space-y-3">
          <input
            className="input text-lg font-medium"
            placeholder="Escribe tu pregunta..."
            value={q.text}
            onChange={(e) => updateField('text', e.target.value)}
          />
          <div className="flex gap-3 flex-wrap">
            <select className="input w-48" value={q.type} onChange={(e) => updateField('type', e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={q.required} onChange={(e) => updateField('required', e.target.checked)} />
              Obligatoria
            </label>
          </div>

          {hasOptions && (
            <div className="space-y-2 pl-2 border-l-2 border-primary-200">
              {q.options?.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opción ${i + 1}`} />
                  <button onClick={() => removeOption(i)} className="p-2 hover:bg-red-50 text-red-500 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addOption} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                <Plus size={14} /> Agregar opción
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => update({ ...q })} className="p-2 hover:bg-gray-100 rounded" title="Duplicar">
            <Copy size={16} />
          </button>
          <button onClick={remove} className="p-2 hover:bg-red-50 text-red-500 rounded" title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SurveyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState({
    title: '', description: '', status: 'draft',
    publishedUrl: '', questions: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      surveysService.get(id).then((data) => {
        if (data) setSurvey(data);
      });
    }
  }, [id]);

  const updateQuestion = (updated) => {
    setSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) => (q.id === updated.id ? updated : q)),
    }));
  };

  const removeQuestion = (qid) => {
    setSurvey((s) => ({ ...s, questions: s.questions.filter((q) => q.id !== qid) }));
  };

  const addQuestion = () => {
    setSurvey((s) => ({
      ...s,
      questions: [
        ...s.questions,
        { id: `q_${Date.now()}`, text: '', type: 'single', required: false, options: [''], order: s.questions.length },
      ],
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSurvey((s) => {
        const oldIndex = s.questions.findIndex((q) => q.id === active.id);
        const newIndex = s.questions.findIndex((q) => q.id === over.id);
        return { ...s, questions: arrayMove(s.questions, oldIndex, newIndex) };
      });
    }
  };

  const save = async () => {
    if (!survey.title.trim()) return toast.error('Agrega un título');
    setSaving(true);
    try {
      const questions = survey.questions.map((q, i) => ({ ...q, order: i }));
      if (id) {
        await surveysService.update(id, { ...survey, questions });
        toast.success('Encuesta actualizada');
      } else {
        const ref = await surveysService.create({ ...survey, questions });
        toast.success('Encuesta creada');
        navigate(`/admin/surveys/${ref.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{id ? 'Editar encuesta' : 'Nueva encuesta'}</h1>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Información general</h2>
        <div className="space-y-3">
          <input className="input" placeholder="Título de la encuesta" value={survey.title} onChange={(e) => setSurvey({ ...survey, title: e.target.value })} />
          <textarea className="input" placeholder="Descripción" rows={3} value={survey.description} onChange={(e) => setSurvey({ ...survey, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={survey.status} onChange={(e) => setSurvey({ ...survey, status: e.target.value })}>
              <option value="draft">Borrador</option>
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="closed">Cerrada</option>
            </select>
            <input className="input" placeholder="URL donde fue publicada" value={survey.publishedUrl || ''} onChange={(e) => setSurvey({ ...survey, publishedUrl: e.target.value })} />
          </div>
          {survey.publicSlug && (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <span className="font-mono">URL pública:</span>{' '}
              <code>{window.location.origin}/survey/{survey.publicSlug}</code>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Preguntas ({survey.questions.length})</h2>
        <button onClick={addQuestion} className="btn-secondary flex items-center gap-2">
          <Plus size={16} /> Agregar pregunta
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={survey.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          {survey.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              update={updateQuestion}
              remove={() => removeQuestion(q.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {survey.questions.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          Aún no hay preguntas. Agrega la primera.
        </div>
      )}
    </div>
  );
}