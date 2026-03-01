document.addEventListener('DOMContentLoaded', () => {
    // === 0. LOGIN SYSTEM ===
    const loginOverlay = document.getElementById('login-overlay');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    const checkLogin = () => {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            if (loginOverlay) loginOverlay.style.display = 'none';
        }
    };

    if (loginBtn && loginPassword) {
        loginBtn.addEventListener('click', () => {
            if (loginPassword.value === '0903') { // Senha solicitada pelo usuário
                sessionStorage.setItem('isLoggedIn', 'true');
                loginOverlay.style.display = 'none';
            } else {
                loginError.style.display = 'block';
            }
        });

        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        checkLogin();
    }

    // === 1. ELEMENTOS DA UI ===
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');

    // Tabela
    const categoryTitle = document.getElementById('category-title');
    const addRowBtn = document.getElementById('add-row-btn');
    const tableBody = document.getElementById('table-body');
    const pageCategory = document.getElementById('page-category');

    let currentCategory = ''; // Guarda qual cômodo estamos editando

    // Configurações do App
    const EMOJIS = ['⏳', '✔️', '✖️']; // Opções rápidas de status (Ampulheta, Certo, Errado)

    // === 2. EVENTOS DO MENU (DRAWER) ===
    const toggleMenu = () => {
        sideMenu.classList.toggle('open');
        overlay.classList.toggle('active');
    };

    menuBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // === 3. ROTEAMENTO NAVEGACIONAL (SPA) ===
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Controle visual do link ativo
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Qual página foi clicada?
            const targetPage = link.getAttribute('data-page');

            // Esconde todas as páginas e mostra a escolhida
            pages.forEach(p => {
                p.classList.remove('active');
                p.classList.add('hidden'); // Oculta visualmente se necessário via flex
                p.style.display = 'none';
            });

            if (targetPage === 'home') {
                document.getElementById('page-home').classList.add('active');
                document.getElementById('page-home').style.display = 'flex';
                currentCategory = '';
            } else {
                // É uma categoria (Ex: cozinha, sala)
                pageCategory.classList.add('active');
                pageCategory.style.display = 'flex';
                currentCategory = targetPage;

                // Atualiza o Título
                categoryTitle.textContent = link.textContent;

                // Carregar Tabela Desse Cômodo
                loadTableData();
            }

            // Fechar o menu após escolher no mobile
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // === 4. SISTEMA DE TABELA E LOCALSTORAGE ===

    // Estrutura Padrão de uma Linha Nova
    const createNewRowObj = () => ({
        id: Date.now().toString(),
        produto: '',
        quantidade: '1',
        link: '',
        status: '⏳' // Começa sempre com o ícone de tempo/pendente
    });

    // Função que renderiza uma linha (tr) baseada num objeto de dados
    const renderRow = (rowData) => {
        const tr = document.createElement('tr');
        tr.dataset.id = rowData.id;

        tr.innerHTML = `
            <td><input type="text" class="editable-cell" value="${rowData.produto}" placeholder="Ex: Geladeira" data-field="produto"></td>
            <td><input type="text" class="editable-cell" value="${rowData.quantidade}" placeholder="1 un" data-field="quantidade"></td>
            <td>
                <div class="link-container">
                    <input type="url" class="editable-cell link-input" value="${rowData.link}" placeholder="https://..." data-field="link" readonly>
                    <button class="edit-link-btn" title="Editar Link">✏️</button>
                </div>
            </td>
            <td class="col-emoji emoji-cell" data-field="status" title="Clique para mudar">${rowData.status || '⏳'}</td>
        `;

        // 4.1 Listener para salvar edição do Input
        const inputs = tr.querySelectorAll('.editable-cell');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const field = e.target.getAttribute('data-field');
                updateData(rowData.id, field, e.target.value);
            });

            if (input.classList.contains('link-input')) {
                input.style.cursor = 'pointer';
                const editBtn = tr.querySelector('.edit-link-btn');

                input.addEventListener('click', (e) => {
                    if (input.readOnly) {
                        const url = e.target.value;
                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                            window.open(url, '_blank');
                        }
                    }
                });

                editBtn.addEventListener('click', () => {
                    input.readOnly = false;
                    input.style.cursor = 'text';
                    input.focus();
                });

                input.addEventListener('blur', () => {
                    input.readOnly = true;
                    input.style.cursor = 'pointer';
                });
            }
        });

        // 4.2 Listener para clique na Célula de Emoji
        const emojiCell = tr.querySelector('.emoji-cell');
        emojiCell.addEventListener('click', () => {
            // Cicla entre os EMOJIS
            let currentIndex = EMOJIS.indexOf(emojiCell.textContent);
            let nextIndex = (currentIndex + 1) % EMOJIS.length;
            let nextEmoji = EMOJIS[nextIndex];

            emojiCell.textContent = nextEmoji;
            updateData(rowData.id, 'status', nextEmoji);
        });

        tableBody.appendChild(tr);
    };

    // Lê do LocalStorage
    const getStorageData = () => {
        const data = localStorage.getItem('enxovalData');
        return data ? JSON.parse(data) : {};
    };

    // Salva no LocalStorage
    const saveStorageData = (dataObj) => {
        localStorage.setItem('enxovalData', JSON.stringify(dataObj));
    };

    // Atualiza um campo específico de uma linha salva
    const updateData = (rowId, field, value) => {
        if (!currentCategory) return;

        const allData = getStorageData();
        if (!allData[currentCategory]) return;

        // Encontra o item
        const itemIndex = allData[currentCategory].findIndex(item => item.id === rowId);
        if (itemIndex > -1) {
            allData[currentCategory][itemIndex][field] = value;
            saveStorageData(allData);
        }
    };

    // Carrega a tabela para o cômodo selecionado
    const loadTableData = () => {
        tableBody.innerHTML = ''; // Limpa antes de renderizar
        const allData = getStorageData();
        const categoryData = allData[currentCategory] || [];

        // Se a categoria veio vazia pela primeira vez, adiciona uma linha em branco prs instigar uso
        if (categoryData.length === 0) {
            addNewRow(true); // Salva no LocalStorage para não perder dados caso a tela seja recarregada
        } else {
            categoryData.forEach(row => renderRow(row));
        }
    };

    // Adiciona uma nova linha através do Botão
    const addNewRow = (shouldSave = true) => {
        if (!currentCategory) return;

        const newRow = createNewRowObj();
        const allData = getStorageData();

        if (!allData[currentCategory]) {
            allData[currentCategory] = [];
        }

        allData[currentCategory].push(newRow);

        if (shouldSave) {
            saveStorageData(allData);
        }

        renderRow(newRow);
    };

    // Ligar o botão "+ Adicionar Produto"
    addRowBtn.addEventListener('click', () => {
        addNewRow(true);
    });

    // Fazer foco voltar a primeira aba com uma injeção de estilo manual no JS pro fallback caso precise
    document.getElementById('page-home').style.display = 'flex';
});
