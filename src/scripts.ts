// 1
import { PrismaClient } from "@prisma/client";

// 2
const prisma = new PrismaClient();

// 3
async function main() {
  const d = new Date();

  const newUser = await prisma.stats.create({
    data: {
      operation: "getUrl",
      success: true,
      resposeTime: 100,
    } 
  });
  console.log(`Created new user: ${newUser.id} ${newUser.operation} ${newUser.success} ${newUser.resposeTime}`);
  const allLinks = await prisma.user.findMany();
  console.log(allLinks);
}

// 4
main()
  // 5
  .finally(async () => {
    await prisma.$disconnect();
  });
