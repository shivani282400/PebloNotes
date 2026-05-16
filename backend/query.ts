import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const note = await prisma.note.findFirst({
    where: { title: { contains: 'Sprint Planning' } },
    include: { aiSummary: true }
  })
  console.log(JSON.stringify(note, null, 2))
}
main()
