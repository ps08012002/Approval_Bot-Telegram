import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.tb_cabang.createMany({
    data: [{ cabang: "Surabaya" }, { cabang: "Sidoarjo" }, { cabang: "Gresik"}, ], //Masukkan data cabang sesuai kebutuhan
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
