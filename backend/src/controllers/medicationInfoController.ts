import { Response } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../middleware/auth';

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function getMedicationInfo(req: AuthRequest, res: Response): Promise<void> {
  const name = (req.query.name as string || '').trim();

  if (!name) {
    res.status(400).json({ error: 'Parâmetro "name" é obrigatório' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(503).json({ error: 'Consulta de informações não disponível (chave OpenAI não configurada)' });
    return;
  }

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente farmacêutico informativo. Responda sempre em português do Brasil. ' +
            'Forneça informações básicas e objetivas sobre medicamentos: para que serve, classe terapêutica e observações importantes. ' +
            'Nunca substitua orientação médica. Seja conciso (máximo 4 parágrafos curtos). ' +
            'Se o nome não corresponder a um medicamento conhecido, informe isso claramente.',
        },
        {
          role: 'user',
          content: `Me dê informações básicas sobre o medicamento: ${name}`,
        },
      ],
      max_tokens: 350,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || 'Sem informações disponíveis.';
    res.json({ name, summary });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error.status === 401) {
      res.status(503).json({ error: 'Chave OpenAI inválida' });
    } else if (error.status === 429) {
      res.status(503).json({ error: 'Limite da API OpenAI atingido. Tente novamente em instantes.' });
    } else {
      console.error('OpenAI error:', err);
      res.status(500).json({ error: 'Erro ao consultar informações do medicamento' });
    }
  }
}
