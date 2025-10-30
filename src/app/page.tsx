import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Найти или создать первый чат для пользователя
  let chat = await prisma.chat.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!chat) {
    // Создать первый чат
    chat = await prisma.chat.create({
      data: {
        title: "New Chat",
        userId: session.user.id,
      },
    });
  }

  // Перенаправить на чат
  redirect(`/chat/${chat.id}`);
}
