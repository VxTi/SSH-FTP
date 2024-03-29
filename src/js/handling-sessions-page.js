let delete_button;

document.addEventListener('DOMContentLoaded', () => {
    delete_button = document.querySelector('.delete-button');
    document.onclick = () => delete_button.style.visibility = 'hidden';

    window.ssh.sessions.get()
        .then(results => {
            results.forEach(session => addSession(session));
            document.getElementById('add-sessions')
                .addEventListener('click', () => window.location.href = './pages/page-login-ssh.html');
        })
});



/**
 * Method for adding a session to the list of sessions.
 * @param {{port: number, host: string, username: string, password: string, privateKey: string, passphrase: string}} session
 */
function addSession(session) {
    let session_container = document.querySelector('.session-content');

    let session_element = document.createElement('div');
    session_element.classList.add('session-element', 'user-interact');
    session_container.appendChild(session_element);
    session_element.dataset.langTitle = 'session.join.tooltip'

    let session_host = document.createElement('span');
    session_host.classList.add('session-name');
    session_host.innerText = session.host;
    session_element.appendChild(session_host);

    let session_name = document.createElement('span');
    session_name.classList.add('session-name');
    session_name.innerText = session.username;
    session_element.appendChild(session_name);

    session_element.addEventListener('click', () => {
        document.querySelector('.session-container').style.visibility = 'hidden';
        document.querySelector('.loading').style.visibility = 'visible';
        window.ssh.connect(session.host, session.username, session.password, session.port, session.privateKey, session.passphrase)
            .then(_ => window.location.href = './pages/page-file-explorer.html')
            .catch(_ => {
                document.querySelector('.loading').style.visibility = 'hidden';
                document.querySelector('.session-container').style.visibility = 'visible'
            });
    })

    session_element.addEventListener('contextmenu', (event) => {
        delete_button.style.setProperty('--delete-pos-x', `${session_element.offsetLeft}px`);
        delete_button.style.setProperty('--delete-pos-y', `${session_element.offsetTop + session_element.offsetHeight + 4}px`);
        delete_button.style.visibility = 'visible';
        delete_button.onclick = () => {
            window.ssh.sessions.delete(session.host, session.username);
            session_element.remove();
        }
    })
}