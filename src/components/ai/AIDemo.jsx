/**
 * IA: dejar solo el Asistente conversacional.
 * Este componente muestra únicamente el panel del asistente y elimina
 * tabs y vistas de sugerencias, predicción, recomendaciones y análisis.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MessageSquare } from 'lucide-react';
import { useAssistant } from '../../hooks/useAI.js';

export function AIDemo({ pieces = [], materials = [], config = {} }) {
  return <AssistantPanel pieces={pieces} materials={materials} config={config} />;
}

function AssistantPanel({ pieces, materials, config }) {
  const { conversation, isThinking, sendMessage, clearConversation } = useAssistant();
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    await sendMessage(inputMessage, { pieces, materials, config });
    setInputMessage('');
  };

  const quickMessages = [
    '¿Qué kerf debo usar?',
    '¿Cómo mejorar el aprovechamiento?',
    'Explica los algoritmos',
    'Necesito 5 piezas de 30x40cm',
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare />
          Asistente Conversacional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Conversación */}
          <div className="h-64 overflow-y-auto border rounded p-3 space-y-2">
            {conversation.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>¡Hola! Soy tu asistente de cortes inteligente.</p>
                <p className="text-sm">Pregúntame sobre configuración, optimización o cualquier duda.</p>
              </div>
            ) : (
              conversation.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-2 rounded-lg ${
                      message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs bg-white/20 hover:bg-white/30"
                            onClick={() => setInputMessage(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="animate-bounce">🤔</div>
                    <span>Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mensajes rápidos */}
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((message, index) => (
              <Button key={index} size="sm" variant="outline" onClick={() => setInputMessage(message)}>
                {message}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isThinking}
            />
            <Button onClick={handleSendMessage} disabled={isThinking || !inputMessage.trim()}>
              Enviar
            </Button>
          </div>

          {conversation.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearConversation}>
              Limpiar conversación
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}