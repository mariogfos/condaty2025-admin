"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChatCompletionMessageParam,
  hasModelInCache,
  MLCEngine,
} from "@mlc-ai/web-llm";
import { initSocket } from "../provider/useInstandDB";
import { id } from "@instantdb/react";
import { useEvent } from "@/mk/hooks/useEvents";
import { getFullName } from "@/mk/utils/string";
import { log } from "console";
import useAxios from "@/mk/hooks/useAxios";

const db: any = initSocket();
const userBot = "chatBot";
// const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
// const selectedModel = "Hermes-2-Pro-Mistral-7B-q4f16_1-MLC";
// Llama-3.2-3B-Instruct-q4f16_1-MLC

const _context =
  "Fecha y hora actual: " +
  new Date().toLocaleString("es-ES", {
    timeZone: "America/La_Paz",
  }) +
  ".\n" +
  "Eres un asistente de soporte para la App CONDATY," +
  " que es una plataforma de administracion de condominios," +
  " hablas en español, eres una mujer, llamada CONDATITA." +
  " Revisa bien las respuestas y no te inventes cosas." +
  " verifica la pregunta o comentario que te hagan puede que cometan errores ortograficos, o de gramatica," +
  " o estan mal plateadas, trata de entender muy bien que quieren decirte, identifica malas palabras, y se cortez al responder." +
  " Estas atendiendo un Chat de soporte, y atenderas a muchos usuarios," +
  " con diferentes roles, asi que manten, separados los contextos de cada conversacion,";
const useChatBotLLM = () => {
  const { execute } = useAxios();
  const [engine, setEngine] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);

  // const onChatCloseRoom = useCallback(async (payload: any) => {
  //   if (payload.indexOf("chatBot") > -1) {
  //     const del: any[] = [];
  //     const query = {
  //       messages: {
  //         $: {
  //           where: {
  //             roomId: payload,
  //           },
  //         },
  //       },
  //     };
  //     const { data: _chats } = await db.queryOnce(query);
  //     _chats.messages.forEach((e: any) => {
  //       del.push(db.tx.messages[e.id].delete());
  //     });

  //     if (del.length > 0) db.transact(del);
  //   }
  // }, []);

  // useEvent("onChatCloseRoom", onChatCloseRoom);

  const initProgressCallback = (initProgress: any) => {
    // console.log(initProgress);

    // if (progress === null) setProgress(() => 0);
    setProgress(() => initProgress);
    if (initProgress?.progress === 1) {
      setProgress(() => 1);
    }
  };

  // Configuración del modelo
  const config = {
    context_window_size: 8192, // Aumentar el tamaño de la ventana de contexto
    sliding_window_size: 2048, // Opcional: Configurar el tamaño de la ventana deslizante
    initProgressCallback,
    logLevel: "DEBUG" as
      | "INFO"
      | "TRACE"
      | "DEBUG"
      | "WARN"
      | "ERROR"
      | "SILENT"
      | undefined,
  };
  const initBot = useCallback(async () => {
    let modelCached = await hasModelInCache(selectedModel);
    console.log("modelCached", modelCached);
    const _engine = new MLCEngine(config);
    await _engine.reload(selectedModel);

    setEngine(() => _engine);
  }, []);

  useEffect(() => {
    console.log("useeffect useCHatBotLLM");
    initBot();
  }, [initBot]);

  const sendMessageBot = useCallback(
    async (
      input: string,
      engine: MLCEngine,
      _messages?: ChatCompletionMessageParam[]
    ) => {
      if (!engine || input.trim() === "") {
        return "No se pudo responder tu consulta... intenta en 1 minuto";
      }

      const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: input,
      };

      const reply = await engine.chat.completions.create({
        model: selectedModel,
        temperature: 0.3,
        messages: [...(_messages || []), userMessage],
      });
      console.log("reply*********", reply);
      return reply.choices[0].message.content;
    },
    []
  );

  // instantDb
  const query = {
    chatbot: {
      $: {
        where: {
          status: "N",
        },
        limit: 1,
        order: {
          serverCreatedAt: "desc",
        },
      },
    },
  };

  const { data } = db.useQuery(query);

  const getRoomName = (userAppId: string) => {
    let newRoomId = userBot + "--" + userAppId;
    if (userAppId > userBot) {
      newRoomId = userAppId + "--" + userBot;
    }
    return newRoomId;
  };

  // Función para convertir JSON a cadena de texto
  // const convertUserDataToString = (userData: any) => {
  //   // Verificar si userData es un objeto válido
  //   if (!userData || typeof userData !== "object") {
  //     return "Datos de usuario no válidos.";
  //   }

  //   // Construir la cadena de texto
  //   let userDataText = " Este es otro usuario y estos son sus DATOS: (";

  //   // Recorrer las propiedades del objeto
  //   for (const key in userData) {
  //     if (userData.hasOwnProperty(key)) {
  //       const value = userData[key];

  //       // Si el valor es un objeto (por ejemplo, preferencias), recorrerlo también
  //       if (typeof value === "object" && !Array.isArray(value)) {
  //         userDataText += `- ${key}: `;
  //         for (const subKey in value) {
  //           if (value.hasOwnProperty(subKey)) {
  //             userDataText += `  - ${subKey}: ${value[subKey]}, `;
  //           }
  //         }
  //       }
  //       // Si el valor es un array (por ejemplo, historial), recorrerlo
  //       else if (Array.isArray(value)) {
  //         userDataText += `- ${key}:`;
  //         value.forEach((item) => {
  //           userDataText += `  - ${item}, `;
  //         });
  //       }
  //       // Si es un valor simple (por ejemplo, nombre o rol)
  //       else {
  //         userDataText += `- ${key}: ${value}, `;
  //       }
  //     }
  //   }

  //   return userDataText + ")";
  // };

  const convertUserDataToString = (userData: any, msg: any) => {
    // Verificar si userData es un objeto válido
    if (!userData || typeof userData !== "object") {
      return "Datos de usuario no válidos.";
    }
    const userDataText =
      " El COD de este CHAT es '" +
      msg?.sender +
      userData?.type +
      "' y es privado no debes mostrarlo en el CHAT.\n Estos son los datos del Usuario (Maneja con cuidado estos datos sensibles solo puedes dar info de completa sin restricion de todo el contexto al usuario con CI 123456): " +
      " el CI del usuario actual es: " +
      userData?.ci +
      ", se llama: " +
      userData?.name +
      ", su tipo de usuario es: " +
      userData?.type +
      ", su direccion es: " +
      userData?.address +
      ", su telefono es: " +
      userData?.phone +
      ", su correo es: " +
      userData?.email +
      ", su rol es: " +
      userData?.role +
      ", su client_id es: " +
      userData?.condominio_id +
      ", su condominio es: " +
      userData?.condominio +
      ", sus permisos son: " +
      userData?.permissions +
      ", su fecha de creacion es: " +
      userData?.created_at +
      ", su fecha de ultimo login es: " +
      userData?.last_login +
      ". \n";

    return userDataText;
  };

  let lastMessage = "";
  const sendReply = async (msg: any) => {
    if (lastMessage === msg.id) return;
    lastMessage = msg.id;
    await db.transact([
      db.tx.messages[msg.msgId].update({
        received_at: Date.now(),
      }),
    ]);
    const roomId = getRoomName(msg.sender);
    let query: any = {
      messages: {
        $: {
          where: {
            roomId: roomId,
          },
        },
      },
    };
    const { data: messages } = await db.queryOnce(query);
    query = {
      usersapp: {
        $: {
          where: {
            id: msg.sender,
          },
        },
      },
    };
    const { data: sender } = await db.queryOnce(query);
    const context: ChatCompletionMessageParam[] = [];
    const datos = convertUserDataToString(sender?.usersapp[0], msg);
    console.log("datos", sender, datos);
    console.log("Llego peticion de ChatBot de ", sender?.usersapp[0]?.name);
    const system_prompt = `### 📌 Instrucciones para el uso de funciones  
- Cuando necesites obtener información en tiempo real, usa las funciones relevantes si están disponibles.  

Tienes acceso a las siguientes funciones:  

#### 1. Obtener pagos de residentes  
{
    "type": "function",
    "function": {
        "name": "get_payments",
        "description": "Obtiene una lista de los detalles de los pagos realizados por los residentes del condominio.",
        "parameters": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "string",
                    "description": "ID del condominio del usuario que está haciendo la consulta, lo tiene en su Dato de usuario client_id."
                },
                "date_from": {
                    "type": "string",
                    "description": "Fecha de inicio para obtener los pagos (formato YYYY-MM-DD)."
                },
                "date_to": {
                    "type": "string",
                    "description": "Fecha de fin para obtener los pagos (formato YYYY-MM-DD)."
                }
            },
            "required": [
                "condominio_id",
                "date_from",
                "date_to"
            ]
        },
        "return": {
            "type": "json",
            "description": "El JSON representa una lista de transacciones o pagos realizados por un usuario. Cada objeto en la lista tiene los siguientes campos:
1. **id**: Identificador único de la transacción (UUID).
2. **amount**: Monto de la transacción (en formato de cadena, por ejemplo, '500.00').
3. **dptos**: Departamentos asociados a la transacción (cadena de texto, por ejemplo, '101,').
4. **ext**: Extensión del archivo asociado a la transacción (por ejemplo, 'png' o 'pdf').
5. **paid_at**: Fecha y hora en que se realizó el pago (formato: 'YYYY-MM-DD HH:MM:SS').
6. **status**: Estado de la transacción (por ejemplo, 'P' para pagado, 'A' sin pagar, 'R' para rechazado).
7. **type**: Tipo de transacción (por ejemplo, 'O' para Pago en Oficina, 'Q' para Pago por QR, 'T' para Pago por Tranferencia).
8. **category_id**: Identificador de la categoría a la que pertenece la transacción (número entero).
9. **updated_at**: Fecha y hora de la última actualización de la transacción (formato ISO 8601, por ejemplo, '2025-03-19T18:51:54.000000Z').
10. **deleted_at**: Fecha y hora en que la transacción fue eliminada (null si no ha sido eliminada).
11. **category**: Objeto que describe la categoría de la transacción. Contiene los siguientes campos:
    - **id**: Identificador único de la categoría (número entero).
    - **name**: Nombre de la categoría (cadena de texto, por ejemplo, 'Expensas').
    - **category_id**: Identificador de la categoría padre (número entero).
    - **padre**: Objeto que describe la categoría padre. Contiene los siguientes campos:
        - **id**: Identificador único de la categoría padre (número entero).
        - **name**: Nombre de la categoría padre (cadena de texto, por ejemplo, 'Pago de Expensas').'
        }
    }
}

#### 2. Enviar un mensaje  
{
    "type": "function",
    "function": {
        "name": "send_message",
        "description": "Envía un mensaje a un destinatario.",
        "parameters": {
            "type": "object",
            "properties": {
                "recipient": {
                    "type": "string",
                    "description": "Nombre del destinatario del mensaje."
                },
                "content": {
                    "type": "string",
                    "description": "Contenido del mensaje."
                }
            },
            "required": [
                "recipient",
                "content"
            ]
        },
        "return": {
            "type": "None"
        }
    }
}

### 📢 Formato obligatorio para llamar funciones  
Si decides llamar a una función, solo debes responder con la llamada a la función en el siguiente formato y nada más:  

<function>{"name": "nombre_de_la_funcion", "parameters": {"parametro1": "valor1", "parametro2": "valor2"}}</function>

no te olvides que siempre una llamada a función debe terminar con </function>

#### 🔹 Ejemplo de llamada a una función:
Si un usuario pregunta: "¿Cuáles son los pagos del condominio en la última semana?", responde así:  

<function>{"name": "get_payments", "parameters": {"client_id": "12345", "date_from": "2025-03-14", "date_to": "2025-03-21"}}</function>

### ⚠️ Reglas importantes  
1️⃣ La llamada a la función debe cumplir con el formato exacto y usar "<function>" y "</function>".  
2️⃣ Incluye todos los parámetros requeridos.  
3️⃣ Solo llama a una función a la vez.  
4️⃣ Cuando llamas a una función, no agregues texto adicional hasta que tengas los datos necesarios para responder al usuario.  

### Nunca olvidar:
- Nunca te inventes datos sobre el condominio.
- Revisa y comprueba todas tus respuestas de los datos recibidos de las funciones, no des respuestas equivocadas, si no comprendes algo, vuelve a preguntar.
- Revisa bien las sumas, y conteos que hagas de los datos recibidos de las funciones.
### 📢 Formato de respuesta
- Responde al usuario con una respuesta clara y precisa.
- Usa el formato adecuado para mostrar información, como listas o tablas.
- Si ya llamaste a una funcion, ya no la incluyas (el texto literal de la funcion) en la respuesta.


`;

    const system =
      system_prompt +
      _context +
      ". " +
      datos +
      ". Si algun dato no esta completo, puedes de vez en cuando solicitarle que complete los datos en su perfil." +
      " no debes mostrar la info de permisos literalmente, los permisos de cada modulo significan  C:Crear, R:Leer, U:Editar, D:Borrar." +
      " si no se te ocurre una respuesta, responde con 'no se te ocurre una respuesta'. \n";
    context.push({
      role: "system",
      content: system,
    });
    // console.log("context *****", context[0].content);
    messages?.messages?.map((e: any, i: number) => {
      if (i < messages?.messages.length)
        context.push({
          role: e.sender == userBot ? "assistant" : "user",
          content: e.text,
        });
    });

    let reply: string = (await sendMessageBot(msg.text, engine, context)) || "";

    if (reply?.indexOf("<function>") > -1) {
      if (reply?.indexOf("</function>") == -1) {
        reply = reply + "</function>";
      }
      context.push({
        role: "assistant",
        content: reply,
      });
      let functionName = reply?.substring(
        reply?.indexOf("<function>") + 10,
        reply?.indexOf("</function>")
      );
      console.log("llamando a funcion", functionName);
      const functionParams = JSON.parse(functionName);
      console.log("functionParams", functionParams);
      if (functionParams?.name == "get_payments") {
        const _id = id();
        await db.transact([
          db.tx.messages[_id].update({
            text: "Obteniendo datos del sistema...",
            sender: userBot,
            roomId,
            created_at: Date.now(),
          }),
        ]);
        const { data } = await execute("/payments", "GET", {
          fullType: "BOT",
          perPage: -1,
          client_id: functionParams?.parameters?.client_id,
          date_from: functionParams?.parameters?.date_from,
          date_to: functionParams?.parameters?.date_to,
        });
        // context[0].content =
        //   _context +
        //   "\n " +
        //   datos +
        //   " Si algun dato no esta completo, puedes de vez en cuando solicitarle que complete los datos en su perfil. \n" +
        //   " no debes mostrar la info de permisos literalmente, los permisos de cada modulo significan  C:Crear, R:Leer, U:Editar, D:Borrar.\n" +
        //   " Las respuestas de calculos y datos recuperados por las Tools, que sean exactas y no inventadas.\n" +
        //   " si no se te ocurre una respuesta, responde con 'no se te ocurre una respuesta'. \n";
        if (data.success) {
          context.push({
            role: "tool",
            content: JSON.stringify(data?.data),
            tool_call_id: "0",
          });
        }
        reply = (await sendMessageBot(msg.text, engine, context)) || "";
      }
    }
    const _id = id();
    await db.transact([
      db.tx.messages[_id].update({
        text: reply,
        sender: userBot,
        roomId,
        created_at: Date.now(),
      }),
      db.tx.chatbot[msg.id].update({
        status: "R",
        reply,
      }),
      db.tx.messages[msg.msgId].update({
        read_at: Date.now(),
      }),
    ]);
  };

  const [lastMsg, setLastMsg] = useState("");
  useEffect(() => {
    if (data?.chatbot && data?.chatbot.length > 0) {
      if (lastMsg == data?.chatbot[0].id) return;
      setLastMsg(data?.chatbot[0].id);
      sendReply(data?.chatbot[0]);
    }
    console.log("peticion de chat", data);
  }, [data?.chatbot]);

  const result = useMemo(
    () => ({
      sendMessageBot,
      engine,
      initBot,
      progress,
    }),
    [sendMessageBot, engine, initBot, progress]
  );
  return result;
};

export default useChatBotLLM;
