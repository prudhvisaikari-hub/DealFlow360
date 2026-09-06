import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const quotation = await prisma.quotation.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(quotation);
  }
  const quotations = await prisma.quotation.findMany();
  return NextResponse.json(quotations);
}

export async function POST(request: Request) {
  const body = await request.json();
  const quotation = await prisma.quotation.create({ data: body });
  return NextResponse.json(quotation, { status: 201 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const data = await request.json();
  const quotation = await prisma.quotation.update({ where: { id: Number(id) }, data });
  return NextResponse.json(quotation);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.quotation.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
