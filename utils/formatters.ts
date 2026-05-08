export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return '';

    // Handle YYYY-MM-DD mainly used in input type="date"
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    try {
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) {
        return dateString;
    }
};
