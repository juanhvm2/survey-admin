import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { surveysService } from '@/services/surveysService';
import { responsesService } from '@/services/responsesService';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicSurvey() {
  const { slug } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    surveysService.getBySlug(slug).then((s) => {
      if (s) {
        setSurvey(s);
        const initial = {};
        s.questions.forEach((q) => (initial[q.id] = q.type === 'multiple' ? [] : ''));
        setAnswers(initial);
      }
    });
  }, [slug]);

  if (!survey) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  if (survey.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
          <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
          <p className="text-gray-500">Esta encuesta ya no acepta respuestas.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
          <h1 className="text-2xl font-bold mb-2">¡Gracias!</h1>
          <p className="text-gray-500">Tu respuesta fue registrada correctamente.</p>
        </div>
      </div>
    );
  }

  const validate = () => {
    for (const q of survey.questions) {
      if (!q.required) continue;
      const a = answers[q.id];
      if (q.type === 'multiple') {
        if (!a || a.length === 0) return `${q.text}: elige al menos una opción`;
      } else if (!a || (typeof a === 'string' && !a.trim())) {
        return `${q.text}: esta pregunta es obligatoria`;
      }
      if (q.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) {
        return 'Email inválido';
      }
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      await responsesService.submit(survey.id, answers);
      setSubmitted(true);
    } catch (err) {
      toast.error('Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (qid, value) => setAnswers((a) => ({ ...a, [qid]: value }));
  const toggleMulti = (qid, val) => {
    setAnswers((a) => {
      const arr = a[qid] || [];
      return { ...a, [qid]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <form onSubmit={submit} className="max-w-2xl mx-auto space-y-4">
        <div className="card">
          <h1 className="text-3xl font-bold mb-2">{survey.title}</h1>
          {survey.description && <p className="text-gray-600">{survey.description}</p>}
        </div>

        {survey.questions.map((q, i) => (
          <div key={q.id} className="card">
            <label className="block font-semibold mb-3">
              {i + 1}. {q.text} {q.required && <span className="text-red-500">*</span>}
            </label>

            {q.type === 'single' && (
              <div className="space-y-2">
                {q.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => handleChange(q.id, opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multiple' && (
              <div className="space-y-2">
                {q.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={answers[q.id]?.includes(opt)} onChange={() => toggleMulti(q.id, opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'short' && (
              <input className="input" value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} />
            )}
            {q.type === 'long' && (
              <textarea className="input" rows={4} value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} />
            )}
            {q.type === 'number' && (
              <input type="number" className="input" value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} />
            )}
            {q.type === 'email' && (
              <input type="email" className="input" value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} />
            )}
            {q.type === 'yesno' && (
              <div className="flex gap-3">
                {['Sí', 'No'].map((o) => (
                  <label key={o} className="flex-1 p-3 border rounded-lg text-center hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name={q.id} value={o} checked={answers[q.id] === o} onChange={() => handleChange(q.id, o)} className="mr-2" />
                    {o}
                  </label>
                ))}
              </div>
            )}
            {q.type === 'scale' && (
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button key={n} type="button" onClick={() => handleChange(q.id, n)} className={`w-10 h-10 rounded-lg border ${answers[q.id] === n ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Enviando...' : 'Completar encuesta'}
        </button>
      </form>
    </div>
  );
}