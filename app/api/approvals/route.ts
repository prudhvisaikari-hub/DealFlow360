import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const approval = await prisma.approval.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(approval);
  }
  const approvals = await prisma.approval.findMany();
  return NextResponse.json(approvals);
}

export async function POST(request: Request) {
  const body = await request.json();
  const approval = await prisma.approval.create({ data: body });
  return NextResponse.json(approval, { status: 201 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const data = await request.json();
  const approval = await prisma.approval.update({ where: { id: Number(id) }, data });
  return NextResponse.json(approval);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.approval.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
