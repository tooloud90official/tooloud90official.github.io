export async function loadNativeSelect({
  target,
  options = [],
  value = "",
  placeholder = "선택",
  onChange = null,
  disabled = false,
}) {
  const mount =
    typeof target === "string" ? document.querySelector(target) : target;

  if (!mount) return null;

  const res = await fetch("/_common/select/select.html");
  const html = await res.text();
  mount.innerHTML = html;

  const root = mount.querySelector(".select-root");
  const select = mount.querySelector("[data-native-select]");

  if (!select) return null;

  const normalizedOptions = options.map((item) => {
    if (typeof item === "string") {
      return {
        value: item,
        label: item,
      };
    }
    return {
      value: item.value,
      label: item.label,
    };
  });

  select.innerHTML = "";

  if (placeholder) {
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = !value;
    select.appendChild(placeholderOption);
  }

  normalizedOptions.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;

    if (String(item.value) === String(value)) {
      option.selected = true;
    }

    select.appendChild(option);
  });

  if (!value && root) {
    root.classList.add("is-placeholder");
  } else {
    root.classList.remove("is-placeholder");
  }

  select.disabled = disabled;

  select.addEventListener("change", () => {
    if (root) {
      if (select.value) {
        root.classList.remove("is-placeholder");
      } else {
        root.classList.add("is-placeholder");
      }
    }

    const selectedOption = normalizedOptions.find(
      (item) => String(item.value) === String(select.value)
    );

    if (onChange) {
      onChange(
        {
          value: select.value,
          label: selectedOption ? selectedOption.label : select.options[select.selectedIndex]?.textContent || "",
        },
        select
      );
    }
  });

  return {
    root,
    select,
    getValue() {
      return select.value;
    },
    setValue(nextValue) {
      select.value = nextValue;

      if (root) {
        if (select.value) {
          root.classList.remove("is-placeholder");
        } else {
          root.classList.add("is-placeholder");
        }
      }

      const selectedOption = normalizedOptions.find(
        (item) => String(item.value) === String(select.value)
      );

      if (onChange) {
        onChange(
          {
            value: select.value,
            label: selectedOption ? selectedOption.label : "",
          },
          select
        );
      }
    },
    setDisabled(nextDisabled) {
      select.disabled = !!nextDisabled;
    },
  };
}