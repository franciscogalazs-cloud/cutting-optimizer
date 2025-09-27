/**
 * Asistente Conversacional Básico para Cutting Optimizer
 * Entiende comandos en lenguaje natural y ofrece ayuda contextual
 */

export class ConversationalAssistant {
  constructor() {
    this.conversationHistory = [];
    this.context = {
      currentPieces: [],
      currentMaterials: [],
      currentConfig: {},
      lastOptimization: null
    };
    
    // Patrones de comandos en español
    this.commandPatterns = this.initializeCommandPatterns();
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   */
  async processMessage(message, context = {}) {
    try {
      // Actualizar contexto
      this.updateContext(context);
      
      // Limpiar y normalizar el mensaje
      const normalizedMessage = this.normalizeMessage(message);
      
      // Detectar intención del usuario
      const intent = this.detectIntent(normalizedMessage);
      
      // Generar respuesta basada en la intención
      const response = await this.generateResponse(intent, normalizedMessage, context);
      
      // Guardar en historial
      this.addToHistory(message, response);
      
      return response;
      
    } catch (error) {
      console.warn('Error procesando mensaje:', error);
      return this.getErrorResponse();
    }
  }

  /**
   * Inicializa patrones de comandos en español
   */
  initializeCommandPatterns() {
    return {
      // Agregar piezas
      addPieces: {
        patterns: [
          /necesito (\d+) piezas? de (\d+)x(\d+)/i,
          /agregar (\d+) piezas? de (\d+) por (\d+)/i,
          /quiero (\d+) piezas? de (\d+)x(\d+)/i,
          /(\d+) piezas? de (\d+)x(\d+)/i
        ],
        action: 'add_pieces'
      },
      
      // Agregar materiales
      addMaterials: {
        patterns: [
          /tengo (\d+) tableros? de (\d+)x(\d+)/i,
          /material de (\d+)x(\d+)/i,
          /(\d+) tableros? de (\d+) por (\d+)/i
        ],
        action: 'add_materials'
      },
      
      // Consultas sobre configuración
      configQuery: {
        patterns: [
          /qu[eé] kerf usar/i,
          /cu[aá]nto margen/i,
          /permitir rotaci[oó]n/i,
          /mejor configuraci[oó]n/i
        ],
        action: 'config_advice'
      },
      
      // Consultas sobre resultados
      resultQuery: {
        patterns: [
          /cu[aá]nto desperdicio/i,
          /qu[eé] aprovechamiento/i,
          /c[oó]mo mejorar/i,
          /por qu[eé] no cabe/i
        ],
        action: 'result_analysis'
      },
      
      // Optimización
      optimize: {
        patterns: [
          /optimizar/i,
          /calcular cortes/i,
          /ejecutar/i,
          /cortar/i
        ],
        action: 'optimize'
      },
      
      // Ayuda general
      help: {
        patterns: [
          /ayuda/i,
          /c[oó]mo/i,
          /qu[eé] hago/i,
          /no entiendo/i
        ],
        action: 'help'
      },
      
      // Explicaciones
      explain: {
        patterns: [
          /explica/i,
          /por qu[eé]/i,
          /qu[eé] significa/i,
          /c[oó]mo funciona/i
        ],
        action: 'explain'
      }
    };
  }

  /**
   * Inicializa base de conocimiento
   */
  initializeKnowledgeBase() {
    return {
      concepts: {
        kerf: {
          definition: "El kerf es el ancho del corte que hace la herramienta (sierra, láser, etc.)",
          tips: [
            "Para sierra circular: 2-4mm típico",
            "Para láser: 0.1-0.5mm típico",
            "Para fresadora: 3-6mm típico"
          ]
        },
        
        margin: {
          definition: "El margen es el espacio libre que se deja en los bordes del material",
          tips: [
            "Margen típico: 5-10mm",
            "Para corte manual: 10-15mm",
            "Para CNC: 3-5mm es suficiente"
          ]
        },
        
        utilization: {
          definition: "El aprovechamiento es el porcentaje del material que se usa efectivamente",
          tips: [
            "Buen aprovechamiento: >80%",
            "Aprovechamiento excelente: >90%",
            "Menos del 70% indica problemas de optimización"
          ]
        },
        
        algorithms: {
          definition: "Los algoritmos determinan cómo se distribuyen las piezas en los materiales",
          options: {
            "bestFit": "Mejor para pocas piezas de tamaños similares",
            "maxRects": "Mejor para casos generales, muy eficiente",
            "hybrid": "Combina varios métodos, mejor para casos complejos"
          }
        }
      },
      
      commonIssues: {
        "pieces_dont_fit": {
          problem: "Las piezas no caben en los materiales",
          solutions: [
            "Verificar que las dimensiones de las piezas sean menores que las del material",
            "Habilitar rotación si es posible",
            "Agregar materiales más grandes",
            "Reducir el kerf si es posible"
          ]
        },
        
        "low_utilization": {
          problem: "Bajo aprovechamiento del material",
          solutions: [
            "Agrupar piezas de tamaños similares",
            "Reducir kerf y márgenes si es seguro",
            "Habilitar rotación de piezas",
            "Usar materiales de tamaño más apropiado"
          ]
        },
        
        "high_waste": {
          problem: "Mucho desperdicio de material",
          solutions: [
            "Revisar si las piezas se pueden estandarizar",
            "Considerar hacer piezas adicionales con los restos",
            "Usar algoritmo Hybrid para casos complejos",
            "Verificar configuración de kerf y márgenes"
          ]
        }
      }
    };
  }

  /**
   * Detecta la intención del usuario
   */
  detectIntent(message) {
    for (const [intentName, intent] of Object.entries(this.commandPatterns)) {
      for (const pattern of intent.patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            intent: intent.action,
            match: match,
            confidence: this.calculatePatternConfidence(pattern, message)
          };
        }
      }
    }
    
    // Si no se encontró patrón específico, intentar clasificar por palabras clave
    return this.classifyByKeywords(message);
  }

  /**
   * Clasifica por palabras clave si no hay patrones específicos
   */
  classifyByKeywords(message) {
    const keywords = {
      optimization: ['optimizar', 'calcular', 'eficiencia', 'aprovechamiento'],
      configuration: ['kerf', 'margen', 'rotación', 'configurar'],
      troubleshooting: ['problema', 'error', 'no funciona', 'ayuda'],
      explanation: ['por qué', 'cómo', 'explica', 'significa'],
      data_input: ['pieza', 'material', 'tablero', 'agregar']
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
      const matchCount = words.filter(word => lowerMessage.includes(word)).length;
      if (matchCount > 0) {
        return {
          intent: category,
          match: words.filter(word => lowerMessage.includes(word)),
          confidence: matchCount / words.length
        };
      }
    }
    
    return {
      intent: 'general',
      match: [],
      confidence: 0
    };
  }

  /**
   * Genera respuesta basada en la intención
   */
  async generateResponse(intent, message, context) {
    switch (intent.intent) {
      case 'add_pieces':
        return this.handleAddPieces(intent.match);
        
      case 'add_materials':
        return this.handleAddMaterials(intent.match);
        
      case 'config_advice':
        return this.handleConfigAdvice(message, context);
        
      case 'result_analysis':
        return this.handleResultAnalysis(context);
        
      case 'optimize':
        return this.handleOptimizeRequest(context);
        
      case 'explain':
        return this.handleExplanation(message);
        
      case 'help':
        return this.handleHelpRequest(message, context);
        
      case 'optimization':
        return this.handleOptimizationQuery(context);
        
      case 'configuration':
        return this.handleConfigurationQuery(message, context);
        
      case 'troubleshooting':
        return this.handleTroubleshooting(message, context);
        
      default:
        return this.handleGeneralQuery(message, context);
    }
  }

  /**
   * Maneja solicitudes de agregar piezas
   */
  handleAddPieces(match) {
    const quantity = parseInt(match[1]);
    const length = parseInt(match[2]);
    const width = parseInt(match[3]);
    
    return {
      type: 'action',
      action: 'add_piece',
      data: { quantity, length, width },
      response: `Entendido. Te ayudo a agregar ${quantity} piezas de ${length}x${width}cm. 
      
      📋 **Pasos siguientes:**
      1. Ve a la pestaña "Piezas"
      2. Usa el formulario para agregar: ${quantity} piezas de ${length}x${width}
      3. Dale un nombre descriptivo (ej: "Estante", "Puerta")
      
      ¿Necesitas agregar más piezas o ya podemos optimizar?`,
      
      suggestions: [
        "Agregar más piezas",
        "Continuar con materiales",
        "Ver configuración actual"
      ]
    };
  }

  /**
   * Maneja solicitudes de agregar materiales
   */
  handleAddMaterials(match) {
    const quantity = parseInt(match[1]);
    const length = parseInt(match[2]);
    const width = parseInt(match[3]);
    
    return {
      type: 'action',
      action: 'add_material',
      data: { quantity, length, width },
      response: `Perfect. Te ayudo a agregar ${quantity} tableros de ${length}x${width}cm.
      
      📦 **Pasos siguientes:**
      1. Ve a la pestaña "Materiales"
      2. Agrega: ${quantity} tableros de ${length}x${width}
      3. Define el precio si quieres cálculo de costos
      
      💡 **Tip:** Si tienes diferentes espesores o tipos de material, agrégalos por separado.`,
      
      suggestions: [
        "Agregar más materiales",
        "Ver piezas actuales",
        "Optimizar ahora"
      ]
    };
  }

  /**
   * Maneja consultas de configuración
   */
  handleConfigAdvice(message, context) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('kerf')) {
      return {
        type: 'advice',
        response: `🔧 **Recomendaciones de Kerf:**
        
        El kerf ideal depende de tu herramienta:
        
        • **Sierra circular:** 2.5-3.5mm
        • **Sierra de mesa:** 2-3mm  
        • **Láser CO2:** 0.2-0.5mm
        • **Fresadora CNC:** 3-6mm
        • **Sierra caladora:** 1-2mm
        
        **Tu configuración actual:** ${context.config?.kerfWidth || 'No definida'}mm
        
        💡 **Tip:** Un kerf más preciso mejora el aprovechamiento significativamente.`,
        
        suggestions: [
          "¿Cómo medir el kerf exacto?",
          "Configurar kerf óptimo",
          "Ver más consejos de configuración"
        ]
      };
    }
    
    if (lowerMessage.includes('margen')) {
      return {
        type: 'advice',
        response: `📏 **Recomendaciones de Margen:**
        
        • **Corte manual:** 10-15mm (más margen de error)
        • **Sierra de mesa:** 5-8mm
        • **CNC/Láser:** 3-5mm (muy preciso)
        • **Principiantes:** 8-12mm (seguridad extra)
        
        **Tu configuración actual:** ${context.config?.margin || 'No definida'}mm
        
        ⚖️ **Balance:** Más margen = más seguridad, menos aprovechamiento`,
        
        suggestions: [
          "Optimizar margen para mi caso",
          "¿Qué pasa si el margen es muy pequeño?",
          "Configurar todo automáticamente"
        ]
      };
    }
    
    return this.getGeneralConfigAdvice(context);
  }

  /**
   * Maneja análisis de resultados
   */
  handleResultAnalysis(context) {
    if (!context.lastOptimization) {
      return {
        type: 'info',
        response: `📊 **Análisis de Resultados**
        
        Aún no has ejecutado ninguna optimización. 
        
        Para obtener un análisis detallado:
        1. Define tus piezas y materiales
        2. Ejecuta la optimización
        3. Te daré un análisis completo de los resultados
        
        ¿Quieres que te ayude a configurar tu primera optimización?`,
        
        suggestions: [
          "Configurar mi primera optimización",
          "Ver ejemplo de análisis",
          "¿Qué métricas son importantes?"
        ]
      };
    }
    
    const result = context.lastOptimization;
    const utilization = result.totalUtilization || 0;
    const waste = result.totalWaste || 0;
    
    let analysis = `📊 **Análisis de tu última optimización:**\n\n`;
    
    // Análisis de aprovechamiento
    if (utilization >= 0.9) {
      analysis += `✅ **Excelente aprovechamiento:** ${(utilization * 100).toFixed(1)}%\n`;
      analysis += `Tu optimización es muy eficiente. ¡Felicitaciones!\n\n`;
    } else if (utilization >= 0.75) {
      analysis += `✅ **Buen aprovechamiento:** ${(utilization * 100).toFixed(1)}%\n`;
      analysis += `Resultado sólido. Hay margen para pequeñas mejoras.\n\n`;
    } else {
      analysis += `⚠️ **Aprovechamiento mejorable:** ${(utilization * 100).toFixed(1)}%\n`;
      analysis += `Hay oportunidades significativas de mejora.\n\n`;
    }
    
    // Sugerencias específicas
    analysis += `💡 **Sugerencias de mejora:**\n`;
    
    if (utilization < 0.8) {
      analysis += `• Habilita rotación si no está activa\n`;
      analysis += `• Reduce kerf y márgenes si es seguro\n`;
      analysis += `• Agrupa piezas de tamaños similares\n`;
    }
    
    if (waste > 1000) {
      analysis += `• Considera hacer piezas adicionales con los restos\n`;
      analysis += `• Revisa si puedes estandarizar algunas dimensiones\n`;
    }
    
    return {
      type: 'analysis',
      response: analysis,
      suggestions: [
        "¿Cómo mejorar el aprovechamiento?",
        "Optimizar configuración automáticamente",
        "Ver detalles técnicos"
      ]
    };
  }

  /**
   * Maneja explicaciones de conceptos
   */
  handleExplanation(message) {
    const lowerMessage = message.toLowerCase();
    
    // Buscar conceptos en la base de conocimiento
    for (const [concept, data] of Object.entries(this.knowledgeBase.concepts)) {
      if (lowerMessage.includes(concept) || 
          lowerMessage.includes(data.definition.toLowerCase().split(' ')[0])) {
        
        let explanation = `📚 **${concept.toUpperCase()}**\n\n`;
        explanation += `${data.definition}\n\n`;
        
        if (data.tips) {
          explanation += `💡 **Tips importantes:**\n`;
          data.tips.forEach(tip => explanation += `• ${tip}\n`);
        }
        
        if (data.options) {
          explanation += `🔧 **Opciones disponibles:**\n`;
          Object.entries(data.options).forEach(([key, desc]) => {
            explanation += `• **${key}:** ${desc}\n`;
          });
        }
        
        return {
          type: 'explanation',
          response: explanation,
          suggestions: [
            "Ver más detalles",
            "¿Cómo aplicar esto a mi proyecto?",
            "Siguiente concepto"
          ]
        };
      }
    }
    
    return {
      type: 'explanation',
      response: `🤔 No estoy seguro de qué concepto quieres que explique.
      
      Puedo explicarte sobre:
      • **Kerf** - Ancho del corte
      • **Margen** - Espacio libre en bordes  
      • **Aprovechamiento** - Eficiencia del corte
      • **Algoritmos** - Métodos de optimización
      • **Rotación** - Girar piezas para mejor ajuste
      
      ¿Sobre cuál te gustaría aprender?`,
      
      suggestions: [
        "Explica kerf",
        "Explica aprovechamiento", 
        "Explica algoritmos"
      ]
    };
  }

  /**
   * Métodos auxiliares
   */
  normalizeMessage(message) {
    return message
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n');
  }

  calculatePatternConfidence(pattern, message) {
    const match = message.match(pattern);
    return match ? Math.min(1, match[0].length / message.length) : 0;
  }

  updateContext(context) {
    if (context.pieces) this.context.currentPieces = context.pieces;
    if (context.materials) this.context.currentMaterials = context.materials;
    if (context.config) this.context.currentConfig = context.config;
    if (context.lastOptimization) this.context.lastOptimization = context.lastOptimization;
  }

  addToHistory(message, response) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      userMessage: message,
      assistantResponse: response,
      context: { ...this.context }
    });
    
    // Mantener solo las últimas 50 conversaciones
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  getErrorResponse() {
    return {
      type: 'error',
      response: `😅 Disculpa, tuve un problema procesando tu mensaje.
      
      Puedes intentar:
      • Reformular tu pregunta
      • Usar comandos más simples
      • Escribir "ayuda" para ver qué puedo hacer
      
      Estoy aquí para ayudarte con la optimización de cortes.`,
      
      suggestions: [
        "Ayuda general",
        "¿Cómo agregar piezas?",
        "¿Cómo optimizar?"
      ]
    };
  }

  getGeneralConfigAdvice(context) {
    const pieces = context.pieces || [];
    const materials = context.materials || [];
    
    let advice = `⚙️ **Configuración Recomendada para tu Proyecto:**\n\n`;
    
    if (pieces.length === 0 || materials.length === 0) {
      advice += `Primero necesitas agregar piezas y materiales para darte consejos específicos.\n\n`;
    } else {
      advice += `Basado en tus ${pieces.length} tipos de piezas y ${materials.length} materiales:\n\n`;
      advice += `• **Kerf recomendado:** 3mm (estándar sierra circular)\n`;
      advice += `• **Margen recomendado:** 5mm (balance eficiencia/seguridad)\n`;
      advice += `• **Rotación:** Habilitada (mejora aprovechamiento)\n`;
      advice += `• **Algoritmo:** MaxRects (mejor para casos generales)\n`;
    }
    
    advice += `¿Quieres que ajuste alguno de estos valores?`;
    
    return {
      type: 'advice',
      response: advice,
      suggestions: [
        "Aplicar configuración recomendada",
        "Personalizar para mi herramienta",
        "Explicar cada parámetro"
      ]
    };
  }

  // Métodos adicionales para diferentes tipos de consultas
  handleOptimizeRequest(context) {
    const pieces = context.pieces || [];
    const materials = context.materials || [];
    
    if (pieces.length === 0) {
      return {
        type: 'instruction',
        response: `🚀 **Para optimizar necesitas:**
        
        1. ✅ **Piezas definidas** - Faltan
        2. ❌ **Materiales definidos** - ${materials.length > 0 ? 'Listos' : 'Faltan'}
        3. ❌ **Configuración** - Automática
        
        Primero agrega las piezas que necesitas cortar.`,
        suggestions: ["¿Cómo agregar piezas?", "Ejemplo rápido", "Ver tutorial"]
      };
    }
    
    if (materials.length === 0) {
      return {
        type: 'instruction',
        response: `🚀 **¡Casi listo para optimizar!**
        
        1. ✅ **Piezas definidas** - ${pieces.length} tipos
        2. ❌ **Materiales definidos** - Faltan
        3. ✅ **Configuración** - Lista
        
        Ahora agrega los tableros/materiales que tienes disponibles.`,
        suggestions: ["¿Cómo agregar materiales?", "Optimizar con materiales estándar", "Ver resumen de piezas"]
      };
    }
    
    return {
      type: 'ready',
      response: `🎯 **¡Todo listo para optimizar!**
      
      📊 **Tu proyecto:**
      • ${pieces.length} tipos de piezas
      • ${materials.length} materiales disponibles
      • Configuración automática aplicada
      
      Haz clic en "Optimizar Cortes" para ver los resultados.
      
      🤖 Después del cálculo te daré un análisis detallado.`,
      suggestions: ["Revisar configuración antes", "Optimizar ahora", "Ver predicción de resultados"]
    };
  }

  handleOptimizationQuery(context) {
    return {
      type: 'info',
      response: `🔍 **Sobre la Optimización de Cortes:**
      
      La optimización encuentra la mejor manera de distribuir tus piezas en los materiales disponibles, minimizando el desperdicio.
      
      **Proceso:**
      1. Analiza todas las piezas y materiales
      2. Prueba diferentes combinaciones y rotaciones
      3. Calcula la distribución más eficiente
      4. Te muestra los patrones de corte
      
      **Métricas importantes:**
      • Aprovechamiento (>80% es bueno)
      • Desperdicio total
      • Número de tableros usados`,
      
      suggestions: [
        "¿Qué algoritmo usar?",
        "¿Cómo mejorar resultados?",
        "Ver ejemplo práctico"
      ]
    };
  }

  handleConfigurationQuery(message, context) {
    return this.handleConfigAdvice(message, context);
  }

  handleTroubleshooting(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Identificar problema específico
    for (const [issueKey, issueData] of Object.entries(this.knowledgeBase.commonIssues)) {
      if (lowerMessage.includes(issueData.problem.toLowerCase().split(' ')[0]) ||
          lowerMessage.includes(issueKey.replace('_', ' '))) {
        
        let response = `🔧 **Solución para: ${issueData.problem}**\n\n`;
        response += `**Posibles soluciones:**\n`;
        
        issueData.solutions.forEach((solution, index) => {
          response += `${index + 1}. ${solution}\n`;
        });
        
        response += `\n¿Cuál de estas opciones quieres que te explique más?`;
        
        return {
          type: 'troubleshooting',
          response: response,
          suggestions: issueData.solutions.slice(0, 3)
        };
      }
    }
    
    return {
      type: 'troubleshooting',
      response: `🤔 **¿Tienes algún problema?**
      
      Puedo ayudarte con:
      • Piezas que no caben en materiales
      • Bajo aprovechamiento del material
      • Mucho desperdicio
      • Configuración de parámetros
      • Interpretación de resultados
      
      Descríbeme específicamente qué problema tienes.`,
      
      suggestions: [
        "Las piezas no caben",
        "Mucho desperdicio",
        "No entiendo los resultados"
      ]
    };
  }

  handleHelpRequest(message, context) {
    return {
      type: 'help',
      response: `🤖 **¡Hola! Soy tu asistente de optimización de cortes.**
      
      **Puedo ayudarte con:**
      
      📝 **Comandos útiles:**
      • "Necesito 5 piezas de 30x40" - Agregar piezas
      • "Tengo 2 tableros de 120x240" - Agregar materiales
      • "¿Qué kerf usar?" - Consejos de configuración
      • "¿Cómo mejorar aprovechamiento?" - Análisis
      • "Explica kerf" - Conceptos técnicos
      
      💡 **Ejemplos de preguntas:**
      • "¿Por qué tengo tanto desperdicio?"
      • "¿Qué algoritmo es mejor para mi caso?"
      • "¿Cómo configuro para sierra láser?"
      
      ¿En qué te puedo ayudar específicamente?`,
      
      suggestions: [
        "Configurar mi primer proyecto",
        "Mejorar resultados actuales", 
        "Aprender conceptos básicos"
      ]
    };
  }

  handleGeneralQuery(message, context) {
    return {
      type: 'general',
      response: `🤔 No estoy seguro de entender exactamente qué necesitas.
      
      **Algunas sugerencias:**
      • Sé específico: "Necesito 5 piezas de 30x40cm"
      • Pregunta directamente: "¿Qué kerf usar para láser?"
      • Pide ayuda: "¿Cómo optimizar mejor?"
      
      **¿Qué quieres hacer?**
      • Agregar piezas o materiales
      • Configurar parámetros
      • Entender resultados
      • Resolver un problema
      
      Reformula tu pregunta y te ayudo mejor.`,
      
      suggestions: [
        "Ver comandos disponibles",
        "Ejemplo de uso",
        "Ayuda general"
      ]
    };
  }

  /**
   * Obtiene el historial de conversación
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Limpia el historial de conversación
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Obtiene estadísticas del asistente
   */
  getAssistantStats() {
    const total = this.conversationHistory.length;
    const intents = this.conversationHistory.map(h => h.assistantResponse.type);
    const intentCounts = intents.reduce((acc, intent) => {
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalConversations: total,
      intentDistribution: intentCounts,
      avgResponseLength: total > 0 
        ? this.conversationHistory.reduce((sum, h) => sum + h.assistantResponse.response.length, 0) / total 
        : 0,
      mostCommonIntent: Object.keys(intentCounts).reduce((a, b) => intentCounts[a] > intentCounts[b] ? a : b, 'none')
    };
  }
}

// Instancia singleton
export const conversationalAssistant = new ConversationalAssistant();