import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const notes = await prisma.note.findMany({
    where: { title: { contains: 'Sprint' } },
    include: { aiSummary: true }
  })
  console.log(JSON.stringify(notes.map(n => ({ title: n.title, aiSummary: n.aiSummary })), null, 2))
}
main()
