const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`[CORREGEDORIA / PRF] Bot ${client.user.tag} operando com sucesso!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!painelcorregedoria') {
        if (message.channel.id !== config.canalPainelId) {
            return message.reply({ content: "❌ Este comando só pode ser utilizado no canal oficial da Corregedoria!", ephemeral: true }).catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setTitle("⚖️ CORREGEDORIA • CENTRAL DE ATENDIMENTO")
            .setDescription(
                "📌 **ANTES DE ABRIR UM TICKET:**\n\n" +
                "• **Tickets na categoria errada** serão imediatamente encerrados.\n" +
                "• **Explique seu problema com detalhes.** Tickets com apenas 'oi', 'ajuda' ou sem contexto poderão ser fechados.\n" +
                "• **O prazo médio de resposta** é de 24h a 48h, podendo variar conforme a demanda.\n" +
                "• **Mantenha respeito** absoluto durante o atendimento.\n\n" +
                "📌 **PRECISA DE SUPORTE OU REGISTRAR DENÚNCIA?**\n\n" +
                "Abra um ticket na categoria correta abaixo e aguarde nossa equipa de correição. 🛡️\n\n" +
                "**Corregedoria — Rigor, Ética e Justiça.**"
            )
            .setColor("#8B0000")
            .setFooter({ text: "Departamento de Corregedoria Oficial • PRF", iconURL: message.guild.iconURL() })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('duvidas')
                .setLabel('Dúvidas')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❓'),
            new ButtonBuilder()
                .setCustomId('denuncias_policiais')
                .setLabel('Denúncias Policiais')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚠️'),
            new ButtonBuilder()
                .setCustomId('denuncia_alto_escalao')
                .setLabel('Denúncia Alto Escalão')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛡️')
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('suporte_corregedoria')
                .setLabel('Suporte Corregedoria')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋')
        );

        await message.channel.send({ embeds: [embed], components: [row1, row2] }).catch(() => {});
        await message.delete().catch(() => {});
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId, guild, user } = interaction;
    const acoesValidas = ['duvidas', 'denuncias_policiais', 'denuncia_alto_escalao', 'suporte_corregedoria'];

    if (acoesValidas.includes(customId)) {
        await interaction.deferReply({ ephemeral: true });

        let tituloEmbed = "";
        switch (customId) {
            case 'duvidas': tituloEmbed = "❓ Dúvidas Gerais"; break;
            case 'denuncias_policiais': tituloEmbed = "⚠️ Denúncia Contra Policial"; break;
            case 'denuncia_alto_escalao': tituloEmbed = "🛡️ Denúncia de Alto Escalão"; break;
            case 'suporte_corregedoria': tituloEmbed = "📋 Suporte com a Corregedoria"; break;
        }

        try {
            // Garante que o bot busca os IDs do sub e corregedor com segurança
            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                }
            ];

            // Tenta adicionar o subcorregedor se o ID existir
            if (config.subCorregedorId) {
                try {
                    await guild.members.fetch(config.subCorregedorId);
                    permissionOverwrites.push({
                        id: config.subCorregedorId,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    });
                } catch (e) {
                    console.log("Subcorregedor não encontrado no servidor ou ID inválido.");
                }
            }

            // Tenta adicionar o corregedor geral se o ID existir
            if (config.corregedorId) {
                try {
                    await guild.members.fetch(config.corregedorId);
                    permissionOverwrites.push({
                        id: config.corregedorId,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    });
                } catch (e) {
                    console.log("Corregedor geral não encontrado no servidor ou ID inválido.");
                }
            }

            const channel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites,
            });

            const embedTicket = new EmbedBuilder()
                .setTitle(`⚖️ ${tituloEmbed}`)
                .setDescription(
                    `🚨 **SEM IDEIA PRA BANDIDO • HONRA NA FARDA!**\n\n` +
                    `Olá ${user}, o seu ticket de atendimento/denúncia foi aberto com sucesso.\n\n` +
                    `💬 **Uma pessoa da nossa equipa irá atender o seu ticket em breve, por favor aguarde.**\n\n` +
                    `📌 *Disponha da Polícia Rodoviária Federal.* **CASO NÃO HAJA RETORNO, PODE IR ATÉ O BATALHÃO IN-GAME NOS CONTATAR.**\n\n` +
                    `Descreva os detalhes do seu caso ou envie as suas provas abaixo para que o Corregedor ou Sub possa analisar.`
                )
                .setColor("#003366")
                .setFooter({ text: "Sistema de Corregedoria • PRF", iconURL: guild.iconURL() })
                .setTimestamp();

            const rowClose = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('fechar_ticket')
                    .setLabel('Fechar Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            let mencaoStaff = `<@${config.subCorregedorId}>`;
            if (config.corregedorId) mencaoStaff += ` <@${config.corregedorId}>`;

            await channel.send({ content: `${user} | ${mencaoStaff}`, embeds: [embedTicket], components: [rowClose] });

            // Envia notificação detalhada no privado (DM)
            const idsNotificar = [config.subCorregedorId];
            if (config.corregedorId) idsNotificar.push(config.corregedorId);

            for (const idCorregidor of idsNotificar) {
                try {
                    const membroEquipe = await guild.members.fetch(idCorregidor);
                    if (membroEquipe) {
                        const embedDm = new EmbedBuilder()
                            .setTitle("🚨 NOVO TICKET ABERTO NA CORREGEDORIA")
                            .setDescription(
                                `Um novo ticket foi aberto e requer atenção da Corregedoria.\n\n` +
                                `👤 **Usuário:** ${user.tag} (\`${user.id}\`)\n` +
                                `📁 **Categoria:** ${tituloEmbed}\n` +
                                `💬 **Canal Direto:** <#${channel.id}>\n\n` +
                                `*Aceda ao servidor para conversar com o cidadão.*`
                            )
                            .setColor("#FF8C00")
                            .setTimestamp();

                        await membroEquipe.send({ embeds: [embedDm] }).catch(() => {});
                    }
                } catch (err) {
                    console.log(`Não foi possível enviar DM para o ID ${idCorregidor}`);
                }
            }

            await interaction.editReply({ content: `✅ O seu ticket foi criado com sucesso em: <#${channel.id}>` });

        } catch (error) {
            console.error("Erro ao criar ticket:", error);
            await interaction.editReply({ content: "❌ Ocorreu um erro ao criar o seu ticket. Verifique as permissões do bot." });
        }
    }

    if (customId === 'fechar_ticket') {
        await interaction.reply({ content: "🔒 Este ticket será encerrado e apagado em 5 segundos..." });
        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 5000);
    }
});

client.login(config.token);