import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(user);
  }
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const data = await request.json();
  const user = await prisma.user.update({ where: { id: Number(id) }, data });
  return NextResponse.json(user);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
