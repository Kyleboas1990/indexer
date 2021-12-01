import { Logger } from '@graphprotocol/common-ts'
import { DataTypes, QueryInterface } from 'sequelize'

interface MigrationContext {
  queryInterface: QueryInterface
  logger: Logger
}

interface Context {
  context: MigrationContext
}

export async function up({ context }: Context): Promise<void> {
  const { queryInterface, logger } = context

  logger.info(
    `Rename indexing rule identifier column and add identifier type column`,
  )

  logger.info(`Checking if indexing rules table exists`)
  const tables = await queryInterface.showAllTables()
  if (!tables.includes('IndexingRules')) {
    logger.info(`Indexing rules table does not exist, migration not necessary`)
    return
  }

  logger.info(`Checking if indexing rules table needs to be migrated`)
  const table = await queryInterface.describeTable('IndexingRules')
  const subgraphIdentifierTypeColumn = table.identifierType
  const subgraphIdentifierColumn = table.identifier
  if (subgraphIdentifierTypeColumn && subgraphIdentifierColumn) {
    logger.info(
      `Identifier and identifierType columns already exist, migration not necessary`,
    )
    return
  }

  logger.info(`Adding identifierType column to IndexingRules table`)
  await queryInterface.addColumn('IndexingRules', 'identifierType', {
    type: DataTypes.ENUM('deployment', 'subgraph', 'group'),
    primaryKey: true,
    defaultValue: 'group',
  })

  await queryInterface.renameColumn('IndexingRules', 'deployment', 'identifier')
}

export async function down({ context }: Context): Promise<void> {
  const { queryInterface, logger } = context

  logger.info(
    `Revert renaming indexing rule identifier column and adding identifierType column`,
  )

  return await queryInterface.sequelize.transaction({}, async transaction => {
    const tables = await queryInterface.showAllTables()

    if (tables.includes('IndexingRules')) {
      await context.queryInterface.removeColumn(
        'IndexingRules',
        'identifierType',
        { transaction },
      )

      await queryInterface.renameColumn(
        'IndexingRules',
        'identifier',
        'deployment',
        { transaction },
      )
    }
  })
}
