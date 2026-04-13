const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Mantener las plataformas por defecto y priorizar web sin romper la resolución
// de ficheros .native, necesarios para algunas dependencias base de React Native.
config.resolver.platforms = ['web', ...config.resolver.platforms.filter((platform) => platform !== 'web')]

// Para web: no inyectar InitializeCore (módulos nativos que no existen en web)
const originalGetModulesRunBeforeMainModule = config.serializer.getModulesRunBeforeMainModule
config.serializer.getModulesRunBeforeMainModule = (entryFilePath) => {
  const modules = originalGetModulesRunBeforeMainModule
    ? originalGetModulesRunBeforeMainModule(entryFilePath)
    : []

  // El entryFilePath en web contiene "platform=web" en la URL o es el entry normal
  // Filtramos InitializeCore que no funciona en web
  return modules.filter(
    (mod) => !mod.includes('Libraries/Core/InitializeCore')
  )
}

module.exports = config
