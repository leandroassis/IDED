// app/api/map/route.ts
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest)  {
    /**
     * 1. Recebe as dimensões do mapa (largura, altura)
     */
  try {
    const body = await request.json();

    const {cpf, dateOfBirth, name} = body;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

    // 3. Crie o payload
    const payload = {
        cpf,
        dateOfBirth,
        name
    };

    return NextResponse.json({ token: null });

  } catch (error) {
    console.error("Erro na API de login:", error);
    return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 });
  }
}