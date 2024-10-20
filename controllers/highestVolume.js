const StockModel = require("./../models/stockModel")

const heighestVolume = async(req,res)=>{
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
        const stock = await StockModel.find(query)
            .sort({ volume: -1 })
            .limit(1)
        return res.status(200).json(stock)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = heighestVolume