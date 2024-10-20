const StockModel = require("./../models/stockModel")

const averageClose = async(req,res)=>{
    const { start_date, end_date, symbol } = req.query;
    const query = {}
    if (start_date && end_date) {
        query.date = {
            $gte: new Date(start_date),
            $lte: new Date(end_date),
        }
    }

    if (symbol) {
        query.symbol = symbol
    }
    try {
        const stocks = await StockModel.find(query)
        if (stocks.length === 0) {
            return res.status(404).json({ message: 'No records found for the specified query.' });
        }
        const stockssClose = stocks.reduce((sun, stock) => sun + stock.close, 0)
        const averageClose = stockssClose / stocks.length
        return res.status(200).json({ average_close: averageClose });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
}
module.exports = averageClose