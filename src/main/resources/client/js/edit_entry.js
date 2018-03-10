const subjectElement = document.getElementById("subject")
const tagsElement = document.getElementById("tags")
const messageElement = document.getElementById("message")
const blogEntryId = document.URL.substring(document.URL.indexOf("?id=") + 4);
if (!/^[0-9]+$/.test(blogEntryId)) {
    throw new Error("Only an 'id' parameter of all digits is supported.")
}

let timeoutId;
const submitFormInterval = 1000;

const formChanged = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(submitForm, submitFormInterval);
}

const csrfHeader = document.querySelector("meta[name='_csrf_header']").content
const csrfValue = document.querySelector("meta[name='_csrf']").content
const headers = new Headers([
    [csrfHeader, csrfValue],
    ["Content-Type", "application/json"]
])
const submitForm = () => {
    const checkboxElements = document.querySelectorAll("input[type='checkbox']")
    const tagIds = [];
    checkboxElements
        .forEach(checkboxElement => {
            if (checkboxElement.checked === true) {
                tagIds.push(checkboxElement.value)
            }
        })
    fetch("/api/entries/" + blogEntryId, {
        method: "PUT",
        body: JSON.stringify({
            subject: subjectElement.value,
            message: messageElement.value,
            tagIds
        }),
        headers,
        credentials: 'include'
    }).then((response) => {
        console.log(response)
    })
}

const addEventHandlers = () => {
    subjectElement.addEventListener("input", formChanged)
    messageElement.addEventListener("input", formChanged)
    const labels = document.querySelectorAll("label[id^='tagLabel']")
    labels.forEach(label => label.addEventListener("click", formChanged))
}

const fetchBlogEntry = () => fetch("/api/entries/" + blogEntryId, {
    method: "GET"
}).then((response) => {
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
        return response.json()
    }
    throw new TypeError("JSON expected!")
}).then(json => {
    subjectElement.value = json.subject
    messageElement.value = json.message

    json.tagIds.forEach(tagId => {
        const checkboxElement = document.getElementById("tagCheckbox" + tagId)
        checkboxElement.checked = true
        const labelElement = document.getElementById("tagLabel" + tagId)
    })
})

const fetchTags = () => fetch("/api/tags", {
    method: "GET"
}).then((response) => {
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
        return response.json()
    }
    throw new TypeError("JSON expected!")
}).then(json => {
    json.forEach(tag => {
        const newLabel = document.createElement("label")
        newLabel.id = "tagLabel" + tag.id
        const newInput = document.createElement("input")
        newInput.type = "checkbox"
        newInput.autocomplete = "off"
        newInput.name = "tagCheckbox"
        newInput.id = "tagCheckbox" + tag.id
        newInput.value = tag.id
        const labelText = document.createTextNode(tag.name)
        newLabel.appendChild(newInput)
        newLabel.appendChild(labelText)

        tagsElement.appendChild(newLabel)
    })
}).then(fetchBlogEntry)
    .then(addEventHandlers)

fetchTags()
document.getElementById("subject").focus()
