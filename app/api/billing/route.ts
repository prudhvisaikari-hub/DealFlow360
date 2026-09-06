import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const billing = await prisma.billing.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(billing);
  }
  const billings = await prisma.billing.findMany();
  return NextResponse.json(billings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const billing = await prisma.billing.create({ data: body });
  return NextResponse.json(billing, { status: 201 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const data = await request.json();
  const billing = await prisma.billing.update({ where: { id: Number(id) }, data });
  return NextResponse.json(billing);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.billing.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
