import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../../errors/bad-request.js';
import NotFoundError from '../../errors/not-found.js';

export const getChats = async (req, res) => {
  const userId = req.user.userId;
  const client = await prisma.client.findUnique({
    where: { id: userId },
  });

  if (client) {
    const chats = await prisma.chat.findMany({
      where: { clientId: userId },
      include: {
        serviceItem: { select: { name: true } },
        employee: { select: { name: true, email: true } },
      },
    });

    return res.status(StatusCodes.OK).json(chats);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (employee) {
    const chats = await prisma.chat.findMany({
      where: { employeeId: userId },
      include: {
        serviceItem: { select: { name: true } },
        client: { select: { name: true, email: true } },
      },
    });

    return res.status(StatusCodes.OK).json({ chats });
  }
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.userId;

  const chat = await prisma.chat.findUnique({
    where: { id: parseInt(chatId, 10) },
  });

  const client = await prisma.client.findUnique({
    where: { id: chat.clientId },
    include: { commissioner: true },
  });
  const isCommissioner = client.commissioner.some(
    (commissioner) => commissioner.id === userId
  );
  const isClient = chat.clientId === userId;
  const isEmployee = chat.employeeId === userId;

  console.log(isClient, isEmployee, isCommissioner);

  if (!isClient && !isEmployee && !isCommissioner) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'You do not have access to this chat',
    });
  }

  const messages = await prisma.message.findMany({
    where: { chatId: parseInt(chatId, 10) },
    orderBy: { createdAt: 'asc' },
  });

  res.status(StatusCodes.OK).json(messages);
};

export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const sender = req.user.userId;
  const role = req.user.role;

  const chat = await prisma.chat.findUnique({
    where: { id: parseInt(chatId, 10) },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (
    role !== 'ADMIN' &&
    sender !== chat.clientId &&
    sender !== chat.employeeId
  ) {
    throw new BadRequestError(
      'You are not authorized to send messages in this chat'
    );
  }

  const message = await prisma.message.create({
    data: {
      chatId: parseInt(chatId, 10),
      sender,
      content,
    },
  });

  const io = req.app.get('io');
  if (io) {
    // Emit the message to all clients in the specified chat room
    io.to(chatId).emit('receive-message', {
      chatId,
      content,
      sender,
      createdAt: message.createdAt, // Include the message timestamp
    });
  }

  res.status(StatusCodes.CREATED).json(message);
};

export const getAllChats = async (req, res) => {
  const chats = await prisma.chat.findMany({
    include: {
      serviceItem: { select: { name: true } }, // Include service item details
      client: { select: { name: true, email: true } }, // Include client details
      employee: { select: { name: true, email: true } }, // Include employee details
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: chats,
  });
};

export const getChatByUserId = async (req, res) => {
  const { userId } = req.params;

  const chats = await prisma.chat.findMany({
    where: {
      OR: [{ clientId: userId }, { employeeId: userId }],
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: chats,
  });
};
