/**
 * Asistente Conversacional Avanzado
 * Capaz de realizar acciones concretas en la aplicación
 */

export class AdvancedConversationalAssistant {
  constructor() {
    this.conversationHistory = [];
    this.context = {
      currentPieces: [],
      currentMaterials: [],
      currentConfig: {},
      lastOptimization: null,
      capabilities: new Set()
    };
    
    // Registrar capacidades de acción
    this.actionHandlers = new Map();
    this.initializeActionHandlers();
    
    // Patrones de comandos de acción
    this.actionPatterns = this.initializeActionPatterns();
    
    // Base de conocimientos expandida
    this.knowledgeBase = this.initializeAdvancedKnowledgeBase();
  }

  /**
   * Procesa mensaje con capacidad de ejecutar acciones
   */
  async processMessageWithActions(message, context = {}, actionCallbacks = {}) {
    try {
      // Actualizar contexto y callbacks de acción
      this.updateContext(context);
      this.updateActionCallbacks(actionCallbacks);
      
      // Normalizar mensaje
      const normalizedMessage = this.normalizeMessage(message);
      
      // Detectar si es un comando de acción
      const actionIntent = this.detectActionIntent(normalizedMessage);
      
      if (actionIntent) {
        // Ejecutar acción
        const actionResult = await this.executeAction(actionIntent, normalizedMessage, context);
        
        // Generar respuesta con resultado de acción
        const response = this.generateActionResponse(actionIntent, actionResult);
        
        this.addToHistory(message, response);
        return response;
      } else {
        // Procesar como conversación normal
        return this.processNormalConversation(normalizedMessage, context);
      }
      
    } catch (error) {
      console.error('Error en asistente avanzado:', error);
      return this.getErrorResponse(error);
    }
  }

  /**
   * Inicializa manejadores de acciones
   */
  initializeActionHandlers() {
    // Acciones de configuración
    this.actionHandlers.set('change_algorithm', {
      description: 'Cambiar algoritmo de optimización',
      parameters: ['algorithm'],
      examples: ['cambiar algoritmo a hybrid', 'usar bestFit', 'algoritmo maxRects']
    });
    
    this.actionHandlers.set('adjust_kerf', {
      description: 'Ajustar ancho de corte',
      parameters: ['kerfWidth'],
      examples: ['cambiar ancho de corte a 3mm', 'kerf 2.5mm', 'ancho corte 4']
    });
    
    this.actionHandlers.set('adjust_margin', {
      description: 'Ajustar margen de seguridad',
      parameters: ['margin'],
      examples: ['margen 5mm', 'cambiar margen a 3', 'ajustar margen 7mm']
    });
    
    // Acciones de optimización
    this.actionHandlers.set('run_optimization', {
      description: 'Ejecutar optimización automáticamente',
      parameters: [],
      examples: ['optimizar ahora', 'ejecutar optimización', 'correr algoritmo']
    });
    
    this.actionHandlers.set('clear_pieces', {
      description: 'Limpiar todas las piezas',
      parameters: [],
      examples: ['limpiar piezas', 'borrar todas las piezas', 'reset piezas']
    });
    
    this.actionHandlers.set('clear_materials', {
      description: 'Limpiar todos los materiales',
      parameters: [],
      examples: ['limpiar materiales', 'borrar tableros', 'reset materiales']
    });
    
    // Acciones de datos
    this.actionHandlers.set('add_piece', {
      description: 'Agregar una pieza específica',
      parameters: ['length', 'width', 'quantity', 'name'],
      examples: ['agregar pieza 100x50x2 mesa', 'añadir 80x40 silla', 'nueva pieza 120x60']
    });
    
    this.actionHandlers.set('add_material', {
      description: 'Agregar un material específico',
      parameters: ['length', 'width', 'quantity', 'material'],
      examples: ['agregar tablero 244x122 MDF', 'añadir material 200x100x3', 'nuevo tablero 300x150']
    });
    
    // Acciones de exportación
    this.actionHandlers.set('export_results', {
      description: 'Exportar resultados de optimización',
      parameters: ['format'],
      examples: ['exportar a PDF', 'guardar como imagen', 'exportar CSV']
    });
    
    // Acciones de análisis
    this.actionHandlers.set('analyze_efficiency', {
      description: 'Analizar eficiencia actual',
      parameters: [],
      examples: ['analizar eficiencia', 'revisar desperdicio', 'mostrar estadísticas']
    });
    
    this.actionHandlers.set('suggest_improvements', {
      description: 'Sugerir mejoras automáticamente',
      parameters: [],
      examples: ['sugerir mejoras', 'cómo mejorar', 'optimizar configuración']
    });
  }

  /**
   * Inicializa patrones de comandos de acción
   */
  initializeActionPatterns() {
    return [
      // Patrones de configuración
      {
        pattern: /cambiar?\s+(algoritmo|método)\s+(a\s+)?(\w+)/i,
        action: 'change_algorithm',
        extract: (match) => ({ algorithm: match[3] })
      },
      {
        pattern: /(usar|utilizar|cambiar a)\s+(bestfit|hybrid|maxrects|backtracking)/i,
        action: 'change_algorithm',
        extract: (match) => ({ algorithm: match[2].toLowerCase() })
      },
      {
        pattern: /(ancho\s+de\s+)?corte\s+(\d+(?:\.\d+)?)\s*mm?/i,
        action: 'adjust_kerf',
        extract: (match) => ({ kerfWidth: parseFloat(match[2]) })
      },
      {
        pattern: /kerf\s+(\d+(?:\.\d+)?)/i,
        action: 'adjust_kerf',
        extract: (match) => ({ kerfWidth: parseFloat(match[1]) })
      },
      {
        pattern: /margen\s+(\d+(?:\.\d+)?)\s*mm?/i,
        action: 'adjust_margin',
        extract: (match) => ({ margin: parseFloat(match[1]) })
      },
      
      // Patrones de optimización
      {
        pattern: /(optimizar|ejecutar|correr|iniciar)\s+(ahora|optimización|algoritmo)/i,
        action: 'run_optimization',
        extract: () => ({})
      },
      
      // Patrones de limpieza
      {
        pattern: /(limpiar|borrar|eliminar|reset)\s+(todas?\s+las?\s+)?piezas/i,
        action: 'clear_pieces',
        extract: () => ({})
      },
      {
        pattern: /(limpiar|borrar|eliminar|reset)\s+(todos?\s+los?\s+)?(materiales|tableros)/i,
        action: 'clear_materials',
        extract: () => ({})
      },
      
      // Patrones de adición de piezas
      {
        pattern: /(agregar|añadir|nueva)\s+pieza\s+(\d+)\s*x\s*(\d+)(?:\s*x\s*(\d+))?\s*(.*)?/i,
        action: 'add_piece',
        extract: (match) => ({
          length: parseInt(match[2]),
          width: parseInt(match[3]),
          quantity: match[4] ? parseInt(match[4]) : 1,
          name: match[5] ? match[5].trim() : 'Pieza'
        })
      },
      
      // Patrones de adición de materiales
      {
        pattern: /(agregar|añadir|nuevo)\s+(tablero|material)\s+(\d+)\s*x\s*(\d+)(?:\s*x\s*(\d+))?\s*(.*)?/i,
        action: 'add_material',
        extract: (match) => ({
          length: parseInt(match[3]),
          width: parseInt(match[4]),
          quantity: match[5] ? parseInt(match[5]) : 1,
          material: match[6] ? match[6].trim() : 'Material'
        })
      },
      
      // Patrones de exportación
      {
        pattern: /exportar\s+(a\s+)?(pdf|imagen|csv|excel)/i,
        action: 'export_results',
        extract: (match) => ({ format: match[2].toLowerCase() })
      },
      
      // Patrones de análisis
      {
        pattern: /(analizar|revisar|mostrar)\s+(eficiencia|desperdicio|estadísticas)/i,
        action: 'analyze_efficiency',
        extract: () => ({})
      },
      
      {
        pattern: /(sugerir|sugerencias|cómo)\s+(mejoras?|mejorar|optimizar)/i,
        action: 'suggest_improvements',
        extract: () => ({})
      }
    ];
  }

  /**
   * Detecta intención de acción en el mensaje
   */
  detectActionIntent(message) {
    for (const pattern of this.actionPatterns) {
      const match = message.match(pattern.pattern);
      if (match) {
        return {
          action: pattern.action,
          parameters: pattern.extract(match),
          confidence: 0.8,
          match: match[0]
        };
      }
    }
    return null;
  }

  /**
   * Ejecuta una acción específica
   */
  async executeAction(actionIntent, message, context) {
    const { action, parameters } = actionIntent;
    
    try {
      switch (action) {
        case 'change_algorithm':
          return await this.executeChangeAlgorithm(parameters, context);
          
        case 'adjust_kerf':
          return await this.executeAdjustKerf(parameters, context);
          
        case 'adjust_margin':
          return await this.executeAdjustMargin(parameters, context);
          
        case 'run_optimization':
          return await this.executeRunOptimization(parameters, context);
          
        case 'clear_pieces':
          return await this.executeClearPieces(parameters, context);
          
        case 'clear_materials':
          return await this.executeClearMaterials(parameters, context);
          
        case 'add_piece':
          return await this.executeAddPiece(parameters, context);
          
        case 'add_material':
          return await this.executeAddMaterial(parameters, context);
          
        case 'export_results':
          return await this.executeExportResults(parameters, context);
          
        case 'analyze_efficiency':
          return await this.executeAnalyzeEfficiency(parameters, context);
          
        case 'suggest_improvements':
          return await this.executeSuggestImprovements(parameters, context);
          
        default:
          return { success: false, message: 'Acción no implementada' };
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  /**
   * Implementaciones de acciones específicas
   */
  
  async executeChangeAlgorithm(params, context) {
    const { algorithm } = params;
    const validAlgorithms = ['bestfit', 'hybrid', 'maxrects', 'backtracking'];
    const normalizedAlgorithm = algorithm.toLowerCase();
    
    if (!validAlgorithms.includes(normalizedAlgorithm)) {
      return {
        success: false,
        message: `Algoritmo "${algorithm}" no válido. Opciones: ${validAlgorithms.join(', ')}`
      };
    }
    
    // Llamar callback de cambio de configuración
    if (this.actionCallbacks.onConfigChange) {
      await this.actionCallbacks.onConfigChange({ algorithm: normalizedAlgorithm });
    }
    
    return {
      success: true,
      message: `✅ Algoritmo cambiado a ${algorithm}`,
      data: { algorithm: normalizedAlgorithm }
    };
  }

  async executeAdjustKerf(params, context) {
    const { kerfWidth } = params;
    
    if (kerfWidth < 0.1 || kerfWidth > 10) {
      return {
        success: false,
        message: 'Ancho de corte debe estar entre 0.1mm y 10mm'
      };
    }
    
    if (this.actionCallbacks.onConfigChange) {
      await this.actionCallbacks.onConfigChange({ kerfWidth });
    }
    
    return {
      success: true,
      message: `✅ Ancho de corte ajustado a ${kerfWidth}mm`,
      data: { kerfWidth }
    };
  }

  async executeAdjustMargin(params, context) {
    const { margin } = params;
    
    if (margin < 0 || margin > 20) {
      return {
        success: false,
        message: 'Margen debe estar entre 0mm y 20mm'
      };
    }
    
    if (this.actionCallbacks.onConfigChange) {
      await this.actionCallbacks.onConfigChange({ margin });
    }
    
    return {
      success: true,
      message: `✅ Margen ajustado a ${margin}mm`,
      data: { margin }
    };
  }

  async executeRunOptimization(params, context) {
    if (!context.pieces || context.pieces.length === 0) {
      return {
        success: false,
        message: 'No hay piezas cargadas para optimizar'
      };
    }
    
    if (!context.materials || context.materials.length === 0) {
      return {
        success: false,
        message: 'No hay materiales cargados para optimizar'
      };
    }
    
    if (this.actionCallbacks.onRunOptimization) {
      const result = await this.actionCallbacks.onRunOptimization();
      
      if (result.success) {
        return {
          success: true,
          message: `✅ Optimización ejecutada. Utilización: ${result.utilization}%, Desperdicio: ${result.waste}`,
          data: result
        };
      } else {
        return {
          success: false,
          message: `❌ Error en optimización: ${result.error}`
        };
      }
    }
    
    return {
      success: false,
      message: 'Función de optimización no disponible'
    };
  }

  async executeClearPieces(params, context) {
    if (this.actionCallbacks.onClearPieces) {
      await this.actionCallbacks.onClearPieces();
    }
    
    return {
      success: true,
      message: '✅ Todas las piezas han sido eliminadas',
      data: { clearedPieces: context.pieces?.length || 0 }
    };
  }

  async executeClearMaterials(params, context) {
    if (this.actionCallbacks.onClearMaterials) {
      await this.actionCallbacks.onClearMaterials();
    }
    
    return {
      success: true,
      message: '✅ Todos los materiales han sido eliminados',
      data: { clearedMaterials: context.materials?.length || 0 }
    };
  }

  async executeAddPiece(params, context) {
    const { length, width, quantity, name } = params;
    
    if (length <= 0 || width <= 0 || quantity <= 0) {
      return {
        success: false,
        message: 'Dimensiones y cantidad deben ser mayores a 0'
      };
    }
    
    const piece = {
      length,
      width,
      quantity,
      name: name || 'Pieza',
      id: Date.now() + Math.random()
    };
    
    if (this.actionCallbacks.onAddPiece) {
      await this.actionCallbacks.onAddPiece(piece);
    }
    
    return {
      success: true,
      message: `✅ Pieza agregada: ${name} (${length}x${width}mm, cantidad: ${quantity})`,
      data: piece
    };
  }

  async executeAddMaterial(params, context) {
    const { length, width, quantity, material } = params;
    
    if (length <= 0 || width <= 0 || quantity <= 0) {
      return {
        success: false,
        message: 'Dimensiones y cantidad deben ser mayores a 0'
      };
    }
    
    const materialObj = {
      length,
      width,
      quantity,
      material: material || 'Material',
      id: Date.now() + Math.random()
    };
    
    if (this.actionCallbacks.onAddMaterial) {
      await this.actionCallbacks.onAddMaterial(materialObj);
    }
    
    return {
      success: true,
      message: `✅ Material agregado: ${material} (${length}x${width}mm, cantidad: ${quantity})`,
      data: materialObj
    };
  }

  async executeExportResults(params, context) {
    const { format } = params;
    
    if (!context.lastOptimization) {
      return {
        success: false,
        message: 'No hay resultados de optimización para exportar'
      };
    }
    
    if (this.actionCallbacks.onExport) {
      const result = await this.actionCallbacks.onExport(format);
      
      if (result.success) {
        return {
          success: true,
          message: `✅ Resultados exportados a ${format.toUpperCase()}`,
          data: { format, filename: result.filename }
        };
      }
    }
    
    return {
      success: false,
      message: 'Función de exportación no disponible'
    };
  }

  async executeAnalyzeEfficiency(params, context) {
    if (!context.lastOptimization) {
      return {
        success: false,
        message: 'No hay resultados de optimización para analizar'
      };
    }
    
    const analysis = this.generateEfficiencyAnalysis(context.lastOptimization);
    
    return {
      success: true,
      message: `📊 **Análisis de Eficiencia:**\n${analysis}`,
      data: { analysis: context.lastOptimization }
    };
  }

  async executeSuggestImprovements(params, context) {
    // Usar el sistema de recomendaciones inteligente
    try {
      const { intelligentRecommendationSystem } = await import('./IntelligentRecommendationSystem.js');
      const recommendations = await intelligentRecommendationSystem.generateRecommendations(
        context.pieces, context.materials, context.config, context.lastOptimization
      );
      
      const topRecommendations = recommendations.recommendations.immediate
        .concat(recommendations.recommendations.configuration)
        .slice(0, 3);
      
      if (topRecommendations.length === 0) {
        return {
          success: true,
          message: '✅ Tu configuración actual parece óptima. No hay mejoras sugeridas.',
          data: { recommendations: [] }
        };
      }
      
      const suggestionText = topRecommendations
        .map((rec, i) => `${i + 1}. **${rec.title}**: ${rec.description}`)
        .join('\n');
      
      return {
        success: true,
        message: `💡 **Sugerencias de Mejora:**\n${suggestionText}`,
        data: { recommendations: topRecommendations }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error generando sugerencias'
      };
    }
  }

  /**
   * Genera respuesta para comandos de acción
   */
  generateActionResponse(actionIntent, actionResult) {
    const baseResponse = {
      message: actionResult.message,
      type: actionResult.success ? 'action_success' : 'action_error',
      timestamp: new Date().toISOString(),
      action: actionIntent.action,
      confidence: actionIntent.confidence
    };

    if (actionResult.success && actionResult.data) {
      baseResponse.actionData = actionResult.data;
    }

    return baseResponse;
  }

  /**
   * Procesa conversación normal (sin acciones)
   */
  async processNormalConversation(message, context) {
    // Importar el asistente conversacional original para consultas
    const { conversationalAssistant } = await import('./ConversationalAssistant.js');
    return conversationalAssistant.processMessage(message, context);
  }

  /**
   * Genera análisis de eficiencia
   */
  generateEfficiencyAnalysis(result) {
    const utilization = result.totalUtilization || 0;
    const waste = result.totalWaste || 0;
    const patterns = result.patterns?.length || 0;
    
    let analysis = `• **Utilización**: ${utilization.toFixed(1)}%`;
    
    if (utilization >= 85) {
      analysis += ' (Excelente ✅)';
    } else if (utilization >= 70) {
      analysis += ' (Buena 👍)';
    } else {
      analysis += ' (Mejorable ⚠️)';
    }
    
    analysis += `\n• **Desperdicio**: ${(waste / 10000).toFixed(2)} m²`;
    analysis += `\n• **Patrones generados**: ${patterns}`;
    
    if (utilization < 70) {
      analysis += '\n\n**Recomendaciones:**';
      analysis += '\n- Revisar tamaños de piezas vs materiales';
      analysis += '\n- Considerar cambiar algoritmo a hybrid';
      analysis += '\n- Verificar configuración de márgenes';
    }
    
    return analysis;
  }

  /**
   * Actualiza callbacks de acción
   */
  updateActionCallbacks(callbacks) {
    this.actionCallbacks = { ...callbacks };
  }

  /**
   * Normaliza mensaje de entrada
   */
  normalizeMessage(message) {
    return message.toLowerCase().trim();
  }

  /**
   * Actualiza contexto
   */
  updateContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Agrega conversación al historial
   */
  addToHistory(message, response) {
    this.conversationHistory.push({
      message,
      response,
      timestamp: new Date().toISOString()
    });
    
    // Mantener solo las últimas 10 conversaciones
    if (this.conversationHistory.length > 10) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Respuesta de error
   */
  getErrorResponse(error) {
    return {
      message: `Lo siento, ocurrió un error procesando tu solicitud. ${error?.message || ''}`,
      type: 'error',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Inicializa base de conocimientos avanzada
   */
  initializeAdvancedKnowledgeBase() {
    return {
      actions: Object.fromEntries(this.actionHandlers),
      examples: [
        'cambiar algoritmo a hybrid',
        'ancho de corte 3mm',
        'agregar pieza 100x50x2 mesa',
        'optimizar ahora',
        'limpiar todas las piezas',
        'exportar a PDF',
        'analizar eficiencia',
        'sugerir mejoras'
      ]
    };
  }

  /**
   * Obtiene lista de comandos disponibles
   */
  getAvailableCommands() {
    return Array.from(this.actionHandlers.entries()).map(([action, config]) => ({
      action,
      description: config.description,
      examples: config.examples
    }));
  }
}

// Instancia global
export const advancedConversationalAssistant = new AdvancedConversationalAssistant();